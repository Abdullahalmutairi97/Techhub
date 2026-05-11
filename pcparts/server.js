require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const csrf = require('csurf');
const validator = require('validator');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('./db');
const { isAuth, isGuest } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://js.stripe.com'],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https://placehold.co', 'https://*.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      connectSrc: ["'self'", 'https://api.stripe.com'],
    },
  },
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 },
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

const csrfProtection = csrf();
app.use(csrfProtection);

function getCartCount(userId, callback) {
  if (!userId) return callback(null, 0);
  db.query('SELECT COALESCE(SUM(quantity), 0) AS cnt FROM ShopCart WHERE idU = ?', [userId], (err, rows) => {
    if (err) return callback(null, 0);
    callback(null, parseInt(rows[0].cnt, 10));
  });
}

function sanitize(str) {
  if (str === undefined || str === null) return '';
  return validator.escape(String(str));
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// GET /
app.get('/', (req, res) => {
  const category = req.query.category ? sanitize(req.query.category) : null;
  const search = req.query.search ? sanitize(req.query.search) : null;

  let sql = 'SELECT * FROM Products WHERE isAvailable = TRUE';
  const params = [];

  if (category) { sql += ' AND category = ?'; params.push(req.query.category); }
  if (search) {
    sql += ' AND (labelP LIKE ? OR desP LIKE ? OR brand LIKE ?)';
    const like = `%${req.query.search}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY idP DESC';

  db.query(sql, params, (err, products) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    getCartCount(req.session.user ? req.session.user.idU : null, (__, cartCount) => {
      res.render('index', {
        products, user: req.session.user || null,
        activeCategory: req.query.category || null,
        search: req.query.search || null,
        cartCount, csrfToken: req.csrfToken(),
        flash: req.session.flash || null,
      });
      delete req.session.flash;
    });
  });
});

// GET /product
app.get('/product', (req, res) => {
  const id = parseInt(req.query.id, 10);
  if (!id) return res.status(404).send('<h2>Product not found</h2><a href="/">Go Home</a>');

  db.query('SELECT * FROM Products WHERE idP = ? AND isAvailable = TRUE', [id], (err, rows) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    if (!rows.length) return res.status(404).send('<h2>Product not found</h2><a href="/">Go Home</a>');

    getCartCount(req.session.user ? req.session.user.idU : null, (__, cartCount) => {
      res.render('product', {
        product: rows[0], user: req.session.user || null,
        cartCount, csrfToken: req.csrfToken(),
        flash: req.session.flash || null,
      });
      delete req.session.flash;
    });
  });
});

// POST /add-to-cart
app.post('/add-to-cart', isAuth, (req, res) => {
  const idP = parseInt(req.body.idP, 10);
  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const idU = req.session.user.idU;

  db.query('SELECT * FROM Products WHERE idP = ? AND QtyP > 0 AND isAvailable = TRUE', [idP], (err, rows) => {
    if (err || !rows.length) {
      req.session.flash = { type: 'danger', msg: 'Product not available.' };
      return res.redirect('back');
    }
    db.query(
      'INSERT INTO ShopCart (idU, idP, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
      [idU, idP, quantity, quantity],
      (err2) => {
        if (err2) { console.error(err2); return res.status(500).send('Database error'); }
        req.session.flash = { type: 'success', msg: 'Item added to cart!' };
        res.redirect(`/product?id=${idP}`);
      }
    );
  });
});

// GET /cart
app.get('/cart', (req, res) => {
  if (!req.session.user) {
    return res.render('cart', {
      cartItems: [], user: null, cartCount: 0,
      csrfToken: req.csrfToken(), flash: req.session.flash || null,
    });
  }
  const idU = req.session.user.idU;
  const sql = `
    SELECT sc.idCart, sc.quantity, p.idP, p.labelP, p.priceP, p.QtyP, p.photoPath, p.category, p.brand
    FROM ShopCart sc JOIN Products p ON sc.idP = p.idP
    WHERE sc.idU = ? ORDER BY sc.addedAt DESC
  `;
  db.query(sql, [idU], (err, cartItems) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    getCartCount(idU, (__, cartCount) => {
      res.render('cart', {
        cartItems, user: req.session.user, cartCount,
        csrfToken: req.csrfToken(), flash: req.session.flash || null,
      });
      delete req.session.flash;
    });
  });
});

// POST /cart/update
app.post('/cart/update', isAuth, (req, res) => {
  const idCart = parseInt(req.body.idCart, 10);
  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const idU = req.session.user.idU;
  db.query('UPDATE ShopCart SET quantity = ? WHERE idCart = ? AND idU = ?', [quantity, idCart, idU], (err) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    res.redirect('/cart');
  });
});

// POST /cart/remove/:id
app.post('/cart/remove/:id', isAuth, (req, res) => {
  const idCart = parseInt(req.params.id, 10);
  const idU = req.session.user.idU;
  db.query('DELETE FROM ShopCart WHERE idCart = ? AND idU = ?', [idCart, idU], (err) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    req.session.flash = { type: 'success', msg: 'Item removed from cart.' };
    res.redirect('/cart');
  });
});

// GET /register
app.get('/register', isGuest, (req, res) => {
  res.render('register', {
    user: null, cartCount: 0, csrfToken: req.csrfToken(),
    errors: [], formData: {}, flash: req.session.flash || null,
  });
  delete req.session.flash;
});

// POST /register
app.post('/register', isGuest, async (req, res) => {
  const { username, email, password, confirmPassword, firstName, lastName, phone, address } = req.body;
  const errors = [];

  if (!username || username.trim().length < 3) errors.push('Username must be at least 3 characters.');
  if (!email || !validator.isEmail(email)) errors.push('Please enter a valid email address.');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters.');
  if (password !== confirmPassword) errors.push('Passwords do not match.');

  if (errors.length) {
    return res.render('register', {
      user: null, cartCount: 0, csrfToken: req.csrfToken(),
      errors, formData: { username, email, firstName, lastName, phone, address }, flash: null,
    });
  }

  db.query('SELECT idU FROM Users WHERE uName = ? OR email = ?', [username, email], async (err, rows) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    if (rows.length) {
      return res.render('register', {
        user: null, cartCount: 0, csrfToken: req.csrfToken(),
        errors: ['Username or email already in use.'],
        formData: { username, email, firstName, lastName, phone, address }, flash: null,
      });
    }
    const hash = await bcrypt.hash(password, 12);
    db.query(
      'INSERT INTO Users (uName, uPass, firstName, lastName, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sanitize(username), hash, sanitize(firstName || ''), sanitize(lastName || ''), sanitize(email), sanitize(phone || ''), sanitize(address || '')],
      (err2) => {
        if (err2) { console.error(err2); return res.status(500).send('Database error'); }
        req.session.flash = { type: 'success', msg: 'Account created! Please log in.' };
        res.redirect('/login');
      }
    );
  });
});

// GET /login
app.get('/login', isGuest, (req, res) => {
  res.render('login', {
    user: null, cartCount: 0, csrfToken: req.csrfToken(),
    errors: [], flash: req.session.flash || null,
  });
  delete req.session.flash;
});

// POST /login
app.post('/login', isGuest, (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.render('login', {
      user: null, cartCount: 0, csrfToken: req.csrfToken(),
      errors: ['Please fill in all fields.'], flash: null,
    });
  }
  db.query(
    'SELECT * FROM Users WHERE (uName = ? OR email = ?) AND isActive = TRUE',
    [identifier, identifier],
    async (err, rows) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }
      if (!rows.length) {
        return res.render('login', {
          user: null, cartCount: 0, csrfToken: req.csrfToken(),
          errors: ['Invalid credentials.'], flash: null,
        });
      }
      const user = rows[0];
      const match = await bcrypt.compare(password, user.uPass);
      if (!match) {
        return res.render('login', {
          user: null, cartCount: 0, csrfToken: req.csrfToken(),
          errors: ['Invalid credentials.'], flash: null,
        });
      }
      req.session.regenerate((err2) => {
        if (err2) { console.error(err2); return res.status(500).send('Session error'); }
        req.session.user = {
          idU: user.idU, uName: user.uName, firstName: user.firstName,
          lastName: user.lastName, email: user.email, address: user.address, phone: user.phone,
        };
        const redirectTo = req.session.redirectTo || '/';
        delete req.session.redirectTo;
        res.redirect(redirectTo);
      });
    }
  );
});

// GET /logout
app.get('/logout', (req, res) => { req.session.destroy(() => res.redirect('/')); });

// GET /forgot-password
app.get('/forgot-password', isGuest, (req, res) => {
  res.render('forgot-password', {
    user: null, cartCount: 0, csrfToken: req.csrfToken(),
    sent: false, flash: req.session.flash || null,
  });
  delete req.session.flash;
});

// POST /forgot-password
app.post('/forgot-password', isGuest, (req, res) => {
  const { email } = req.body;
  const sendGenericResponse = () => res.render('forgot-password', {
    user: null, cartCount: 0, csrfToken: req.csrfToken(), sent: true, flash: null,
  });

  if (!email || !validator.isEmail(email)) return sendGenericResponse();

  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 1000 * 60 * 60;

  db.query('SELECT idU FROM Users WHERE email = ?', [email], (err, rows) => {
    if (err || !rows.length) return sendGenericResponse();
    db.query('UPDATE Users SET resetToken = ?, resetExpires = ? WHERE email = ?', [token, expires, email], (err2) => {
      if (err2) return sendGenericResponse();
      const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
      transporter.sendMail({
        from: process.env.EMAIL_USER, to: email,
        subject: 'PCParts — Password Reset',
        html: `<p>Click to reset your password (valid 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      }).catch(() => {});
      sendGenericResponse();
    });
  });
});

// GET /checkout
app.get('/checkout', isAuth, (req, res) => {
  const idU = req.session.user.idU;
  const sql = `
    SELECT sc.idCart, sc.quantity, p.idP, p.labelP, p.priceP, p.photoPath, p.category
    FROM ShopCart sc JOIN Products p ON sc.idP = p.idP WHERE sc.idU = ?
  `;
  db.query(sql, [idU], (err, cartItems) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    if (!cartItems.length) return res.redirect('/cart');
    getCartCount(idU, (__, cartCount) => {
      res.render('checkout', {
        cartItems, user: req.session.user, cartCount,
        csrfToken: req.csrfToken(), errors: [], flash: req.session.flash || null,
      });
      delete req.session.flash;
    });
  });
});

// POST /checkout
app.post('/checkout', isAuth, (req, res) => {
  const { firstName, lastName, email, phone, shippingAddress } = req.body;
  const idU = req.session.user.idU;
  const errors = [];

  if (!firstName || firstName.trim().length < 2) errors.push('First name is required.');
  if (!lastName || lastName.trim().length < 2) errors.push('Last name is required.');
  if (!email || !validator.isEmail(email)) errors.push('Valid email is required.');
  if (!shippingAddress || shippingAddress.trim().length < 10) errors.push('Full shipping address is required.');

  if (errors.length) {
    const sql = `SELECT sc.idCart, sc.quantity, p.idP, p.labelP, p.priceP, p.photoPath, p.category
      FROM ShopCart sc JOIN Products p ON sc.idP = p.idP WHERE sc.idU = ?`;
    return db.query(sql, [idU], (err, cartItems) => {
      getCartCount(idU, (__, cartCount) => {
        res.render('checkout', {
          cartItems: cartItems || [], user: req.session.user, cartCount,
          csrfToken: req.csrfToken(), errors, flash: null,
        });
      });
    });
  }

  const cartSql = `SELECT sc.idP, sc.quantity, p.priceP FROM ShopCart sc
    JOIN Products p ON sc.idP = p.idP WHERE sc.idU = ?`;

  db.query(cartSql, [idU], (err, items) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    if (!items.length) return res.redirect('/cart');

    const total = items.reduce((sum, item) => sum + parseFloat(item.priceP) * item.quantity, 0);
    const fullAddress = `${sanitize(firstName)} ${sanitize(lastName)}, ${sanitize(phone || '')}, ${sanitize(shippingAddress)}`;

    db.query('INSERT INTO Orders (idU, totalPrice, shippingAddress) VALUES (?, ?, ?)',
      [idU, total.toFixed(2), fullAddress],
      (err2, result) => {
        if (err2) { console.error(err2); return res.status(500).send('Database error'); }
        const orderId = result.insertId;
        const itemValues = items.map(i => [orderId, i.idP, i.quantity, i.priceP]);
        db.query('INSERT INTO OrderItems (idO, idP, quantity, priceAtTime) VALUES ?', [itemValues], (err3) => {
          if (err3) { console.error(err3); return res.status(500).send('Database error'); }
          db.query('DELETE FROM ShopCart WHERE idU = ?', [idU], () => {
            res.render('order-confirmation', {
              orderId, total: total.toFixed(2), shippingAddress: fullAddress,
              user: req.session.user, cartCount: 0, csrfToken: req.csrfToken(), flash: null,
            });
          });
        });
      }
    );
  });
});

// ============================================================
// GET /wishlist
// ============================================================
app.get('/wishlist', isAuth, (req, res) => {
  const idU = req.session.user.idU;
  const sql = `
    SELECT w.idW, p.idP, p.labelP, p.priceP, p.photoPath, p.category, p.brand, p.QtyP
    FROM Wishlist w JOIN Products p ON w.idP = p.idP
    WHERE w.idU = ? ORDER BY w.addedAt DESC
  `;
  db.query(sql, [idU], (err, wishlistItems) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    getCartCount(idU, (__, cartCount) => {
      res.render('wishlist', {
        wishlistItems, user: req.session.user, cartCount,
        csrfToken: req.csrfToken(), flash: req.session.flash || null,
      });
      delete req.session.flash;
    });
  });
});

// POST /wishlist/add
app.post('/wishlist/add', isAuth, (req, res) => {
  const idP = parseInt(req.body.idP, 10);
  const idU = req.session.user.idU;

  db.query('SELECT idP FROM Products WHERE idP = ? AND isAvailable = TRUE', [idP], (err, rows) => {
    if (err || !rows.length) {
      req.session.flash = { type: 'danger', msg: 'Product not found.' };
      return res.redirect('back');
    }
    db.query(
      'INSERT IGNORE INTO Wishlist (idU, idP) VALUES (?, ?)',
      [idU, idP],
      (err2) => {
        if (err2) { console.error(err2); return res.status(500).send('Database error'); }
        req.session.flash = { type: 'success', msg: 'Added to wishlist!' };
        res.redirect('back');
      }
    );
  });
});

// POST /wishlist/remove/:id
app.post('/wishlist/remove/:id', isAuth, (req, res) => {
  const idW = parseInt(req.params.id, 10);
  const idU = req.session.user.idU;
  db.query('DELETE FROM Wishlist WHERE idW = ? AND idU = ?', [idW, idU], (err) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    req.session.flash = { type: 'success', msg: 'Removed from wishlist.' };
    res.redirect('/wishlist');
  });
});

// ============================================================
// GET /orders — Order History
// ============================================================
app.get('/orders', isAuth, (req, res) => {
  const idU = req.session.user.idU;
  const sql = `
    SELECT o.idO, o.totalPrice, o.shippingAddress, o.orderStatus, o.createdAt,
      GROUP_CONCAT(p.labelP SEPARATOR '||') AS itemNames,
      GROUP_CONCAT(oi.quantity SEPARATOR '||') AS itemQtys,
      GROUP_CONCAT(oi.priceAtTime SEPARATOR '||') AS itemPrices,
      GROUP_CONCAT(p.photoPath SEPARATOR '||') AS itemPhotos
    FROM Orders o
    JOIN OrderItems oi ON o.idO = oi.idO
    JOIN Products p ON oi.idP = p.idP
    WHERE o.idU = ?
    GROUP BY o.idO
    ORDER BY o.createdAt DESC
  `;
  db.query(sql, [idU], (err, orders) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    const parsed = orders.map(o => ({
      ...o,
      items: o.itemNames.split('||').map((name, i) => ({
        name,
        qty: o.itemQtys.split('||')[i],
        price: o.itemPrices.split('||')[i],
        photo: o.itemPhotos.split('||')[i],
      })),
    }));
    getCartCount(idU, (__, cartCount) => {
      res.render('orders', {
        orders: parsed, user: req.session.user, cartCount,
        csrfToken: req.csrfToken(), flash: req.session.flash || null,
      });
      delete req.session.flash;
    });
  });
});

// ============================================================
// GET /profile
// ============================================================
app.get('/profile', isAuth, (req, res) => {
  const idU = req.session.user.idU;
  db.query('SELECT * FROM Users WHERE idU = ?', [idU], (err, rows) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    getCartCount(idU, (__, cartCount) => {
      res.render('profile', {
        profileUser: rows[0], user: req.session.user, cartCount,
        csrfToken: req.csrfToken(), errors: [], flash: req.session.flash || null,
      });
      delete req.session.flash;
    });
  });
});

// POST /profile
app.post('/profile', isAuth, async (req, res) => {
  const { firstName, lastName, phone, address, currentPassword, newPassword, confirmNewPassword } = req.body;
  const idU = req.session.user.idU;
  const errors = [];

  db.query('SELECT * FROM Users WHERE idU = ?', [idU], async (err, rows) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }
    const dbUser = rows[0];

    let newHash = null;
    if (newPassword) {
      if (!currentPassword) errors.push('Current password is required to set a new password.');
      else {
        const match = await bcrypt.compare(currentPassword, dbUser.uPass);
        if (!match) errors.push('Current password is incorrect.');
        else if (newPassword.length < 8) errors.push('New password must be at least 8 characters.');
        else if (newPassword !== confirmNewPassword) errors.push('New passwords do not match.');
        else newHash = await bcrypt.hash(newPassword, 12);
      }
    }

    if (errors.length) {
      return getCartCount(idU, (__, cartCount) => {
        res.render('profile', {
          profileUser: dbUser, user: req.session.user, cartCount,
          csrfToken: req.csrfToken(), errors, flash: null,
        });
      });
    }

    const sql = newHash
      ? 'UPDATE Users SET firstName=?, lastName=?, phone=?, address=?, uPass=? WHERE idU=?'
      : 'UPDATE Users SET firstName=?, lastName=?, phone=?, address=? WHERE idU=?';
    const params = newHash
      ? [sanitize(firstName), sanitize(lastName), sanitize(phone || ''), sanitize(address || ''), newHash, idU]
      : [sanitize(firstName), sanitize(lastName), sanitize(phone || ''), sanitize(address || ''), idU];

    db.query(sql, params, (err2) => {
      if (err2) { console.error(err2); return res.status(500).send('Database error'); }
      req.session.user.firstName = sanitize(firstName);
      req.session.user.lastName = sanitize(lastName);
      req.session.user.phone = sanitize(phone || '');
      req.session.user.address = sanitize(address || '');
      req.session.flash = { type: 'success', msg: 'Profile updated successfully!' };
      res.redirect('/profile');
    });
  });
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') return res.status(403).send('Invalid form submission.');
  next(err);
});

app.listen(PORT, () => console.log(`PCParts running on http://localhost:${PORT}`));

// ============================================================
// PCParts - Main Server File
// All routes are defined here
// ============================================================

require('dotenv').config();

const express    = require('express');
const session    = require('express-session');
const bcrypt     = require('bcrypt');
const helmet     = require('helmet');
const validator  = require('validator');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const db         = require('./db');
const { isAuth, isGuest } = require('./auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE SETUP
// ============================================================

// Security measure 1: helmet adds security headers automatically
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"],
      scriptSrc:  ["'self'", 'https://cdn.jsdelivr.net', 'https://js.stripe.com'],
      fontSrc:    ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc:     ["'self'", 'data:', 'https://placehold.co'],
      frameSrc:   ["'self'", 'https://js.stripe.com'],
      connectSrc: ["'self'", 'https://api.stripe.com'],
    },
  },
}));

// Security measure 2: httpOnly cookies — JavaScript cannot read the session cookie
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,  // Prevents JavaScript from stealing the cookie
    secure: false,   // Set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

app.use(express.urlencoded({ extended: true })); // Read form data
app.use(express.json());                          // Read JSON data
app.use(express.static('public'));                // Serve CSS, JS, images
app.set('view engine', 'ejs');                    // Use EJS templates

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Get the number of items in a user's cart (for the navbar badge)
function getCartCount(userId, callback) {
  if (!userId) return callback(null, 0);
  db.query(
    'SELECT COALESCE(SUM(quantity), 0) AS cnt FROM ShopCart WHERE idU = ?',
    [userId],
    (err, rows) => {
      if (err) return callback(null, 0);
      callback(null, parseInt(rows[0].cnt, 10));
    }
  );
}

// Email transporter (for password reset emails)
const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ============================================================
// HOME PAGE
// GET / — Show all products, with optional search and category filter
// ============================================================
app.get('/', (req, res) => {
  const category    = req.query.category || null;
  const search      = req.query.search   || null;
  const page        = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage     = 12;
  const offset      = (page - 1) * perPage;

  // Build the SQL query dynamically based on filters
  // Security measure 3: parameterized queries (?) prevent SQL injection
  let countSql = 'SELECT COUNT(*) AS total FROM Products WHERE isAvailable = TRUE';
  let sql      = 'SELECT * FROM Products WHERE isAvailable = TRUE';
  let params   = [];

  if (category) {
    countSql += ' AND category = ?';
    sql      += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    countSql += ' AND (labelP LIKE ? OR desP LIKE ? OR brand LIKE ?)';
    sql      += ' AND (labelP LIKE ? OR desP LIKE ? OR brand LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  sql += ' ORDER BY idP DESC LIMIT ? OFFSET ?';

  // First get total count, then get the current page of products
  db.query(countSql, params, (err, countRows) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }

    const totalProducts = countRows[0].total;
    const totalPages    = Math.ceil(totalProducts / perPage);

    db.query(sql, [...params, perPage, offset], (err2, products) => {
      if (err2) { console.error(err2); return res.status(500).send('Database error'); }

      getCartCount(req.session.user ? req.session.user.idU : null, (__, cartCount) => {
        res.render('index', {
          products,
          user:           req.session.user || null,
          activeCategory: category,
          search,
          cartCount,
          flash:          req.session.flash || null,
          currentPage:    page,
          totalPages,
        });
        delete req.session.flash;
      });
    });
  });
});

// ============================================================
// PRODUCT DETAIL PAGE
// GET /product?id=X — Show a single product
// ============================================================
app.get('/product', (req, res) => {
  const productId = parseInt(req.query.id, 10);

  if (!productId) {
    return res.status(404).send('<h2>Product not found</h2><a href="/">Go Home</a>');
  }

  db.query(
    'SELECT * FROM Products WHERE idP = ? AND isAvailable = TRUE',
    [productId],
    (err, rows) => {
      if (err)          { console.error(err); return res.status(500).send('Database error'); }
      if (!rows.length) { return res.status(404).send('<h2>Product not found</h2><a href="/">Go Home</a>'); }

      getCartCount(req.session.user ? req.session.user.idU : null, (__, cartCount) => {
        res.render('product', {
          product:   rows[0],
          user:      req.session.user || null,
          cartCount,
          flash:     req.session.flash || null,
        });
        delete req.session.flash;
      });
    }
  );
});

// ============================================================
// ADD TO CART
// POST /add-to-cart — Add a product to the shopping cart
// ============================================================
app.post('/add-to-cart', isAuth, (req, res) => {
  const productId = parseInt(req.body.idP, 10);
  const quantity  = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const userId    = req.session.user.idU;

  // First check the product exists and is in stock
  db.query(
    'SELECT * FROM Products WHERE idP = ? AND QtyP > 0 AND isAvailable = TRUE',
    [productId],
    (err, rows) => {
      if (err || !rows.length) {
        req.session.flash = { type: 'danger', msg: 'Product is not available.' };
        return res.redirect('back');
      }

      // Insert into cart, or increase quantity if already there
      db.query(
        'INSERT INTO ShopCart (idU, idP, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
        [userId, productId, quantity, quantity],
        (err2) => {
          if (err2) { console.error(err2); return res.status(500).send('Database error'); }
          req.session.flash = { type: 'success', msg: 'Item added to cart!' };
          res.redirect(`/product?id=${productId}`);
        }
      );
    }
  );
});

// ============================================================
// SHOPPING CART
// GET /cart — Show the cart page
// ============================================================
app.get('/cart', (req, res) => {
  // If not logged in, show empty cart
  if (!req.session.user) {
    return res.render('cart', {
      cartItems: [],
      user:      null,
      cartCount: 0,
      flash:     req.session.flash || null,
    });
  }

  const userId = req.session.user.idU;

  db.query(
    `SELECT sc.idCart, sc.quantity, p.idP, p.labelP, p.priceP, p.QtyP, p.photoPath, p.category, p.brand
     FROM ShopCart sc
     JOIN Products p ON sc.idP = p.idP
     WHERE sc.idU = ?
     ORDER BY sc.addedAt DESC`,
    [userId],
    (err, cartItems) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }

      getCartCount(userId, (__, cartCount) => {
        res.render('cart', {
          cartItems,
          user:      req.session.user,
          cartCount,
          flash:     req.session.flash || null,
        });
        delete req.session.flash;
      });
    }
  );
});

// POST /cart/update — Change the quantity of a cart item
app.post('/cart/update', isAuth, (req, res) => {
  const cartId   = parseInt(req.body.idCart, 10);
  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const userId   = req.session.user.idU;

  db.query(
    'UPDATE ShopCart SET quantity = ? WHERE idCart = ? AND idU = ?',
    [quantity, cartId, userId],
    (err) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }
      res.redirect('/cart');
    }
  );
});

// POST /cart/remove/:id — Remove an item from the cart
app.post('/cart/remove/:id', isAuth, (req, res) => {
  const cartId = parseInt(req.params.id, 10);
  const userId = req.session.user.idU;

  db.query(
    'DELETE FROM ShopCart WHERE idCart = ? AND idU = ?',
    [cartId, userId],
    (err) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }
      req.session.flash = { type: 'success', msg: 'Item removed from cart.' };
      res.redirect('/cart');
    }
  );
});

// ============================================================
// REGISTER
// GET /register — Show register form
// POST /register — Create a new account
// ============================================================
app.get('/register', isGuest, (req, res) => {
  res.render('register', {
    user:     null,
    cartCount: 0,
    errors:   [],
    formData: {},
    flash:    req.session.flash || null,
  });
  delete req.session.flash;
});

app.post('/register', isGuest, async (req, res) => {
  const { username, email, password, confirmPassword, firstName, lastName, phone, address } = req.body;
  const errors = [];

  // Security measure 4: server-side validation — never trust the browser alone
  if (!username || username.trim().length < 3) errors.push('Username must be at least 3 characters.');
  if (!email    || !validator.isEmail(email))  errors.push('Please enter a valid email address.');
  if (!password || password.length < 8)        errors.push('Password must be at least 8 characters.');
  if (password  !== confirmPassword)            errors.push('Passwords do not match.');

  if (errors.length) {
    return res.render('register', {
      user:     null,
      cartCount: 0,
      errors,
      formData: { username, email, firstName, lastName, phone, address },
      flash:    null,
    });
  }

  // Check if username or email is already taken
  db.query(
    'SELECT idU FROM Users WHERE uName = ? OR email = ?',
    [username, email],
    async (err, rows) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }

      if (rows.length) {
        return res.render('register', {
          user:     null,
          cartCount: 0,
          errors:   ['Username or email is already in use.'],
          formData: { username, email, firstName, lastName, phone, address },
          flash:    null,
        });
      }

      // Security measure 5: bcrypt hashes the password before saving it
      const hashedPassword = await bcrypt.hash(password, 12);

      db.query(
        'INSERT INTO Users (uName, uPass, firstName, lastName, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, firstName || '', lastName || '', email, phone || '', address || ''],
        (err2) => {
          if (err2) { console.error(err2); return res.status(500).send('Database error'); }
          req.session.flash = { type: 'success', msg: 'Account created! Please log in.' };
          res.redirect('/login');
        }
      );
    }
  );
});

// ============================================================
// LOGIN
// GET /login — Show login form
// POST /login — Authenticate the user
// ============================================================
app.get('/login', isGuest, (req, res) => {
  res.render('login', {
    user:     null,
    cartCount: 0,
    errors:   [],
    flash:    req.session.flash || null,
  });
  delete req.session.flash;
});

app.post('/login', isGuest, (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.render('login', {
      user:     null,
      cartCount: 0,
      errors:   ['Please fill in all fields.'],
      flash:    null,
    });
  }

  // Find user by username OR email
  db.query(
    'SELECT * FROM Users WHERE (uName = ? OR email = ?) AND isActive = TRUE',
    [identifier, identifier],
    async (err, rows) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }

      const invalidMsg = { user: null, cartCount: 0, errors: ['Invalid username or password.'], flash: null };

      if (!rows.length) return res.render('login', invalidMsg);

      const user       = rows[0];
      const passwordOk = await bcrypt.compare(password, user.uPass);

      if (!passwordOk) return res.render('login', invalidMsg);

      // Security measure 2 continued: regenerate session to prevent session fixation attacks
      req.session.regenerate((err2) => {
        if (err2) { console.error(err2); return res.status(500).send('Session error'); }

        req.session.user = {
          idU:       user.idU,
          uName:     user.uName,
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          address:   user.address,
          phone:     user.phone,
        };

        res.redirect('/');
      });
    }
  );
});

// ============================================================
// LOGOUT
// GET /logout — Destroy session and redirect home
// ============================================================
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ============================================================
// FORGOT PASSWORD
// GET  /forgot-password — Show the form
// POST /forgot-password — Send a reset email
// ============================================================
app.get('/forgot-password', isGuest, (req, res) => {
  res.render('forgot-password', {
    user:     null,
    cartCount: 0,
    sent:     false,
    flash:    req.session.flash || null,
  });
  delete req.session.flash;
});

app.post('/forgot-password', isGuest, (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.render('forgot-password', {
      user:     null,
      cartCount: 0,
      sent:     false,
      flash:    { type: 'danger', msg: 'Please enter a valid email address.' },
    });
  }

  const resetToken   = crypto.randomBytes(32).toString('hex');
  const tokenExpires = Date.now() + 1000 * 60 * 60; // 1 hour

  db.query('SELECT idU FROM Users WHERE email = ?', [email], (err, rows) => {
    if (err || !rows.length) {
      return res.render('forgot-password', {
        user:     null,
        cartCount: 0,
        sent:     true,
        flash:    null,
      });
    }

    db.query(
      'UPDATE Users SET resetToken = ?, resetExpires = ? WHERE email = ?',
      [resetToken, tokenExpires, email],
      (err2) => {
        if (err2) { console.error(err2); return res.status(500).send('Database error'); }

        const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

        mailer.sendMail({
          from:    process.env.EMAIL_USER,
          to:      email,
          subject: 'PCParts — Password Reset',
          html:    `<p>Click the link below to reset your password (valid for 1 hour):</p>
                    <p><a href="${resetLink}">${resetLink}</a></p>`,
        }).catch(() => {});

        res.render('forgot-password', {
          user:     null,
          cartCount: 0,
          sent:     true,
          flash:    null,
        });
      }
    );
  });
});

// ============================================================
// CHECKOUT
// GET  /checkout — Show checkout form with cart summary
// POST /checkout — Place the order
// ============================================================
app.get('/checkout', isAuth, (req, res) => {
  const userId = req.session.user.idU;

  db.query(
    `SELECT sc.idCart, sc.quantity, p.idP, p.labelP, p.priceP, p.photoPath, p.category
     FROM ShopCart sc
     JOIN Products p ON sc.idP = p.idP
     WHERE sc.idU = ?`,
    [userId],
    (err, cartItems) => {
      if (err)               { console.error(err); return res.status(500).send('Database error'); }
      if (!cartItems.length) return res.redirect('/cart');

      getCartCount(userId, (__, cartCount) => {
        res.render('checkout', {
          cartItems,
          user:     req.session.user,
          cartCount,
          errors:   [],
          flash:    req.session.flash || null,
        });
        delete req.session.flash;
      });
    }
  );
});

app.post('/checkout', isAuth, (req, res) => {
  const { firstName, lastName, email, phone, shippingAddress } = req.body;
  const userId = req.session.user.idU;
  const errors = [];

  // Security measure 4: validate all form fields on the server
  if (!firstName       || firstName.trim().length < 2)        errors.push('First name is required.');
  if (!lastName        || lastName.trim().length < 2)         errors.push('Last name is required.');
  if (!email           || !validator.isEmail(email))          errors.push('Valid email is required.');
  if (!shippingAddress || shippingAddress.trim().length < 10) errors.push('Full shipping address is required.');

  if (errors.length) {
    return db.query(
      `SELECT sc.idCart, sc.quantity, p.idP, p.labelP, p.priceP, p.photoPath, p.category
       FROM ShopCart sc JOIN Products p ON sc.idP = p.idP WHERE sc.idU = ?`,
      [userId],
      (_err, cartItems) => {
        getCartCount(userId, (__, cartCount) => {
          res.render('checkout', {
            cartItems: cartItems || [],
            user:     req.session.user,
            cartCount,
            errors,
            flash:    null,
          });
        });
      }
    );
  }

  // Get cart from database (never trust prices from the form)
  db.query(
    `SELECT sc.idP, sc.quantity, p.priceP
     FROM ShopCart sc
     JOIN Products p ON sc.idP = p.idP
     WHERE sc.idU = ?`,
    [userId],
    (err, cartItems) => {
      if (err)               { console.error(err); return res.status(500).send('Database error'); }
      if (!cartItems.length) return res.redirect('/cart');

      // Calculate total on the server (never trust the browser for prices)
      const total       = cartItems.reduce((sum, item) => sum + parseFloat(item.priceP) * item.quantity, 0);
      const fullAddress = `${firstName} ${lastName}, ${phone || ''}, ${shippingAddress}`;

      // Create the order
      db.query(
        'INSERT INTO Orders (idU, totalPrice, shippingAddress) VALUES (?, ?, ?)',
        [userId, total.toFixed(2), fullAddress],
        (err2, result) => {
          if (err2) { console.error(err2); return res.status(500).send('Database error'); }

          const orderId    = result.insertId;
          const orderItems = cartItems.map(item => [orderId, item.idP, item.quantity, item.priceP]);

          // Save order items
          db.query(
            'INSERT INTO OrderItems (idO, idP, quantity, priceAtTime) VALUES ?',
            [orderItems],
            (err3) => {
              if (err3) { console.error(err3); return res.status(500).send('Database error'); }

              // Clear the cart
              db.query('DELETE FROM ShopCart WHERE idU = ?', [userId], () => {
                res.render('order-confirmation', {
                  orderId,
                  total:           total.toFixed(2),
                  shippingAddress: fullAddress,
                  user:            req.session.user,
                  cartCount:       0,
                  flash:           null,
                });
              });
            }
          );
        }
      );
    }
  );
});

// ============================================================
// WISHLIST
// GET  /wishlist        — Show saved products
// POST /wishlist/add    — Save a product to wishlist
// POST /wishlist/remove — Remove a product from wishlist
// ============================================================
app.get('/wishlist', isAuth, (req, res) => {
  const userId = req.session.user.idU;

  db.query(
    `SELECT w.idW, p.idP, p.labelP, p.priceP, p.photoPath, p.category, p.brand, p.QtyP
     FROM Wishlist w
     JOIN Products p ON w.idP = p.idP
     WHERE w.idU = ?
     ORDER BY w.addedAt DESC`,
    [userId],
    (err, wishlistItems) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }

      getCartCount(userId, (__, cartCount) => {
        res.render('wishlist', {
          wishlistItems,
          user:     req.session.user,
          cartCount,
          flash:    req.session.flash || null,
        });
        delete req.session.flash;
      });
    }
  );
});

app.post('/wishlist/add', isAuth, (req, res) => {
  const productId = parseInt(req.body.idP, 10);
  const userId    = req.session.user.idU;

  db.query(
    'SELECT idP FROM Products WHERE idP = ? AND isAvailable = TRUE',
    [productId],
    (err, rows) => {
      if (err || !rows.length) {
        req.session.flash = { type: 'danger', msg: 'Product not found.' };
        return res.redirect('back');
      }

      db.query(
        'INSERT IGNORE INTO Wishlist (idU, idP) VALUES (?, ?)',
        [userId, productId],
        (err2) => {
          if (err2) { console.error(err2); return res.status(500).send('Database error'); }
          req.session.flash = { type: 'success', msg: 'Added to wishlist!' };
          res.redirect('back');
        }
      );
    }
  );
});

app.post('/wishlist/remove/:id', isAuth, (req, res) => {
  const wishlistId = parseInt(req.params.id, 10);
  const userId     = req.session.user.idU;

  db.query(
    'DELETE FROM Wishlist WHERE idW = ? AND idU = ?',
    [wishlistId, userId],
    (err) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }
      req.session.flash = { type: 'success', msg: 'Removed from wishlist.' };
      res.redirect('/wishlist');
    }
  );
});

// ============================================================
// ORDER HISTORY
// GET /orders — Show all past orders for the logged-in user
// ============================================================
app.get('/orders', isAuth, (req, res) => {
  const userId = req.session.user.idU;

  db.query(
    `SELECT
       o.idO, o.totalPrice, o.shippingAddress, o.orderStatus, o.createdAt,
       GROUP_CONCAT(p.labelP    SEPARATOR '||') AS itemNames,
       GROUP_CONCAT(oi.quantity SEPARATOR '||') AS itemQtys,
       GROUP_CONCAT(oi.priceAtTime SEPARATOR '||') AS itemPrices,
       GROUP_CONCAT(p.photoPath SEPARATOR '||') AS itemPhotos
     FROM Orders o
     JOIN OrderItems oi ON o.idO = oi.idO
     JOIN Products   p  ON oi.idP = p.idP
     WHERE o.idU = ?
     GROUP BY o.idO
     ORDER BY o.createdAt DESC`,
    [userId],
    (err, orders) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }

      // Convert the pipe-separated strings into arrays for easy use in the view
      const parsedOrders = orders.map(order => ({
        ...order,
        items: order.itemNames.split('||').map((name, i) => ({
          name,
          qty:   order.itemQtys.split('||')[i],
          price: order.itemPrices.split('||')[i],
          photo: order.itemPhotos.split('||')[i],
        })),
      }));

      getCartCount(userId, (__, cartCount) => {
        res.render('orders', {
          orders:   parsedOrders,
          user:     req.session.user,
          cartCount,
          flash:    req.session.flash || null,
        });
        delete req.session.flash;
      });
    }
  );
});

// ============================================================
// USER PROFILE
// GET  /profile — Show profile page with edit form
// POST /profile — Save profile changes
// ============================================================
app.get('/profile', isAuth, (req, res) => {
  const userId = req.session.user.idU;

  db.query('SELECT * FROM Users WHERE idU = ?', [userId], (err, rows) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }

    getCartCount(userId, (__, cartCount) => {
      res.render('profile', {
        profileUser: rows[0],
        user:        req.session.user,
        cartCount,
        errors:      [],
        flash:       req.session.flash || null,
      });
      delete req.session.flash;
    });
  });
});

app.post('/profile', isAuth, async (req, res) => {
  const { firstName, lastName, phone, address, currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.session.user.idU;
  const errors = [];

  db.query('SELECT * FROM Users WHERE idU = ?', [userId], async (err, rows) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }

    const currentUser     = rows[0];
    let newHashedPassword = null;

    // Only update password if user filled in the password fields
    if (newPassword) {
      if (!currentPassword) {
        errors.push('Please enter your current password to set a new one.');
      } else {
        const passwordMatches = await bcrypt.compare(currentPassword, currentUser.uPass);
        if (!passwordMatches)              errors.push('Current password is incorrect.');
        else if (newPassword.length < 8)   errors.push('New password must be at least 8 characters.');
        else if (newPassword !== confirmNewPassword) errors.push('New passwords do not match.');
        else newHashedPassword = await bcrypt.hash(newPassword, 12);
      }
    }

    if (errors.length) {
      return getCartCount(userId, (__, cartCount) => {
        res.render('profile', {
          profileUser: currentUser,
          user:        req.session.user,
          cartCount,
          errors,
          flash:       null,
        });
      });
    }

    // Build the update query depending on whether password changed
    const sql = newHashedPassword
      ? 'UPDATE Users SET firstName=?, lastName=?, phone=?, address=?, uPass=? WHERE idU=?'
      : 'UPDATE Users SET firstName=?, lastName=?, phone=?, address=? WHERE idU=?';

    const params = newHashedPassword
      ? [firstName, lastName, phone || '', address || '', newHashedPassword, userId]
      : [firstName, lastName, phone || '', address || '', userId];

    db.query(sql, params, (err2) => {
      if (err2) { console.error(err2); return res.status(500).send('Database error'); }

      // Update the session so the navbar shows the updated name immediately
      req.session.user.firstName = firstName;
      req.session.user.lastName  = lastName;
      req.session.user.phone     = phone || '';
      req.session.user.address   = address || '';

      req.session.flash = { type: 'success', msg: 'Profile updated successfully!' };
      res.redirect('/profile');
    });
  });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`PCParts is running at http://localhost:${PORT}`);
});

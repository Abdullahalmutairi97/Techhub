// =============================================================
// server.js  —  TechHub E-Commerce Application
// All routes are defined in this single file.
// =============================================================

require('dotenv').config(); // load variables from .env into process.env

const express   = require('express');
const session   = require('express-session');
const bcrypt    = require('bcrypt');        // password hashing
const helmet    = require('helmet');        // security headers
const validator = require('validator');     // email / input validation
const nodemailer = require('nodemailer');   // sending emails
const crypto    = require('crypto');        // generating random tokens
const csurf     = require('csurf');         // CSRF protection for forms
const db        = require('./db');          // MySQL connection
const { isAuth, isGuest } = require('./auth'); // route guards

const app  = express();
const PORT = process.env.PORT || 3000;


// =============================================================
// SECURITY MIDDLEWARE
// =============================================================

// 1. Helmet — sets secure HTTP headers automatically (prevents clickjacking, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"],
      scriptSrc:  ["'self'", 'https://cdn.jsdelivr.net'],
      fontSrc:    ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc:     ["'self'", 'data:', 'https://placehold.co'],
    },
  },
}));

// 2. Sessions — keeps a user logged in across page loads
//    httpOnly: true  → the cookie cannot be read by JavaScript (prevents XSS theft)
//    secure: false   → set to true when the site uses HTTPS
app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   false,
    maxAge:   1000 * 60 * 60 * 24, // 1 day in milliseconds
  },
}));

// Standard Express middleware
app.use(express.urlencoded({ extended: true })); // read HTML form data
app.use(express.json());                          // read JSON bodies
app.use(express.static('public'));                // serve files from /public
app.set('view engine', 'ejs');                   // use EJS for HTML templates

// 3. CSRF protection — generates a hidden token for each form so that
//    only our own forms can submit to our own routes.
//    Applied per-route (see each GET/POST pair below).
const csrfProtection = csurf();

// Flash middleware — captures flash from session, saves its deletion, then continues.
app.use((req, res, next) => {
  if (req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    req.session.save(() => next());
  } else {
    res.locals.flash = null;
    next();
  }
});


// =============================================================
// EMAIL SETUP  (used for password reset emails)
// Fill in real credentials in .env to make this work.
// =============================================================
const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// =============================================================
// HELPER — get how many items are in a user's cart
// Used to show the badge number on the cart icon in the navbar.
// =============================================================
function getCartCount(userId, callback) {
  if (!userId) return callback(null, 0);
  db.query(
    'SELECT COALESCE(SUM(quantity), 0) AS cnt FROM ShopCart WHERE idU = ?',
    [userId],
    (err, rows) => callback(null, err ? 0 : parseInt(rows[0].cnt, 10))
  );
}


// =============================================================
// HOME PAGE  GET /
// Shows the product grid with optional search and category filter.
// Supports pagination (12 products per page).
// =============================================================
app.get('/', (req, res) => {
  const category = req.query.category || null;
  const search   = req.query.search   || null;
  const page     = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage  = 12;
  const offset   = (page - 1) * perPage;

  // Build the SQL query — extra conditions added only when a filter is active
  // 4. Parameterized queries (?) — prevents SQL injection
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

  // Run count query first, then get the actual products for this page
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
          flash:          res.locals.flash,
          currentPage:    page,
          totalPages,
        });
      });
    });
  });
});


// =============================================================
// PRODUCT DETAIL PAGE  GET /product?id=X
// Shows all information about a single product.
// =============================================================
app.get('/product', (req, res) => {
  const productId = parseInt(req.query.id, 10);

  if (!productId) return res.status(404).send('<h2>Product not found</h2><a href="/">Go Home</a>');

  db.query(
    'SELECT * FROM Products WHERE idP = ? AND isAvailable = TRUE',
    [productId],
    (err, rows) => {
      if (err)          { console.error(err); return res.status(500).send('Database error'); }
      if (!rows.length) return res.status(404).send('<h2>Product not found</h2><a href="/">Go Home</a>');

      getCartCount(req.session.user ? req.session.user.idU : null, (__, cartCount) => {
        res.render('product', {
          product:  rows[0],
          user:     req.session.user || null,
          cartCount,
          flash:    res.locals.flash,
        });
      });
    }
  );
});


// =============================================================
// ADD TO CART  POST /add-to-cart
// Adds a product to the logged-in user's cart.
// If the product is already in the cart, the quantity increases.
// =============================================================
app.post('/add-to-cart', isAuth, (req, res) => {
  const productId = parseInt(req.body.idP, 10);
  const quantity  = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const userId    = req.session.user.idU;

  // Make sure the product exists and is in stock before adding
  db.query(
    'SELECT * FROM Products WHERE idP = ? AND QtyP > 0 AND isAvailable = TRUE',
    [productId],
    (err, rows) => {
      if (err || !rows.length) {
        req.session.flash = { type: 'danger', msg: 'Product is not available.' };
        return res.redirect('back');
      }

      // ON DUPLICATE KEY UPDATE: if the item is already in cart, just add to the quantity
      db.query(
        'INSERT INTO ShopCart (idU, idP, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
        [userId, productId, quantity, quantity],
        (err2) => {
          if (err2) { console.error(err2); return res.status(500).send('Database error'); }
          res.redirect(`/product?id=${productId}`);
        }
      );
    }
  );
});


// =============================================================
// SHOPPING CART  GET /cart
// Shows all items the user has added to their cart.
// If the user is not logged in, an empty cart screen is shown.
// =============================================================
app.get('/cart', (req, res) => {
  if (!req.session.user) {
    return res.render('cart', { cartItems: [], user: null, cartCount: 0, flash: null });
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
          user:     req.session.user,
          cartCount,
          flash:    res.locals.flash,
        });
      });
    }
  );
});

// POST /cart/update — change the quantity of an item in the cart
app.post('/cart/update', isAuth, (req, res) => {
  const cartId   = parseInt(req.body.idCart, 10);
  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const userId   = req.session.user.idU;

  // idU check makes sure users can only edit their own cart rows
  db.query(
    'UPDATE ShopCart SET quantity = ? WHERE idCart = ? AND idU = ?',
    [quantity, cartId, userId],
    (err) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }
      res.redirect('/cart');
    }
  );
});

// POST /cart/remove/:id — remove one item from the cart
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


// =============================================================
// REGISTER  GET /register  POST /register
// Lets a new visitor create an account.
// =============================================================
app.get('/register', isGuest, csrfProtection, (req, res) => {
  res.render('register', {
    user:      null,
    cartCount: 0,
    errors:    [],
    formData:  {},
    flash:     res.locals.flash,
    csrfToken: req.csrfToken(),
  });
});

app.post('/register', isGuest, csrfProtection, async (req, res) => {
  const { username, email, password, confirmPassword, firstName, lastName, phone, address } = req.body;

  // 5. Server-side validation — never trust the browser alone
  const errors = [];
  if (!username || username.trim().length < 3) errors.push('Username must be at least 3 characters.');
  if (!email    || !validator.isEmail(email))  errors.push('Please enter a valid email address.');
  if (!password || password.length < 8)        errors.push('Password must be at least 8 characters.');
  if (password  !== confirmPassword)            errors.push('Passwords do not match.');

  if (errors.length) {
    return res.render('register', {
      user:      null,
      cartCount: 0,
      errors,
      formData:  { username, email, firstName, lastName, phone, address },
      flash:     null,
      csrfToken: req.csrfToken(),
    });
  }

  // Check if the username or email is already taken
  db.query(
    'SELECT idU FROM Users WHERE uName = ? OR email = ?',
    [username, email],
    async (err, rows) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }

      if (rows.length) {
        return res.render('register', {
          user:      null,
          cartCount: 0,
          errors:    ['Username or email is already in use.'],
          formData:  { username, email, firstName, lastName, phone, address },
          flash:     null,
          csrfToken: req.csrfToken(),
        });
      }

      // 6. bcrypt — hash the password before saving (never store plain text)
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


// =============================================================
// LOGIN  GET /login  POST /login
// Authenticates a user with username/email + password.
// =============================================================
app.get('/login', isGuest, csrfProtection, (req, res) => {
  res.render('login', {
    user:      null,
    cartCount: 0,
    errors:    [],
    flash:     res.locals.flash,
    csrfToken: req.csrfToken(),
  });
});

app.post('/login', isGuest, csrfProtection, (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.render('login', {
      user:      null,
      cartCount: 0,
      errors:    ['Please fill in all fields.'],
      flash:     null,
      csrfToken: req.csrfToken(),
    });
  }

  // Accept login by username OR by email
  db.query(
    'SELECT * FROM Users WHERE (uName = ? OR email = ?) AND isActive = TRUE',
    [identifier, identifier],
    async (err, rows) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }

      const badCredentials = { user: null, cartCount: 0, errors: ['Invalid username or password.'], flash: null, csrfToken: req.csrfToken() };

      if (!rows.length) return res.render('login', badCredentials);

      const user       = rows[0];
      const passwordOk = await bcrypt.compare(password, user.uPass);

      if (!passwordOk) return res.render('login', badCredentials);

      // Regenerate the session ID after login to prevent session fixation attacks
      req.session.regenerate((err2) => {
        if (err2) { console.error(err2); return res.status(500).send('Session error'); }

        // Save only the fields we need in the session (not the hashed password)
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


// =============================================================
// LOGOUT  GET /logout
// Destroys the session and sends the user back to the home page.
// =============================================================
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});


// =============================================================
// FORGOT PASSWORD  GET /forgot-password  POST /forgot-password
// Sends a password reset link to the user's email address.
// =============================================================
app.get('/forgot-password', isGuest, csrfProtection, (req, res) => {
  res.render('forgot-password', {
    user:      null,
    cartCount: 0,
    sent:      false,
    flash:     res.locals.flash,
    csrfToken: req.csrfToken(),
  });
});

app.post('/forgot-password', isGuest, csrfProtection, (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.render('forgot-password', {
      user:      null,
      cartCount: 0,
      sent:      false,
      flash:     { type: 'danger', msg: 'Please enter a valid email address.' },
      csrfToken: req.csrfToken(),
    });
  }

  // Generate a random token and store it in the database with a 1-hour expiry
  const resetToken   = crypto.randomBytes(32).toString('hex');
  const tokenExpires = Date.now() + 1000 * 60 * 60; // 1 hour from now

  db.query('SELECT idU FROM Users WHERE email = ?', [email], (err, rows) => {
    // If no account found, we still show "sent" so attackers can't guess emails
    if (err || !rows.length) {
      return res.render('forgot-password', {
        user: null, cartCount: 0, sent: true, flash: null, csrfToken: req.csrfToken(),
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
          subject: 'TechHub — Password Reset',
          html:    `<p>Click the link below to reset your password (valid for 1 hour):</p>
                    <p><a href="${resetLink}">${resetLink}</a></p>`,
        }).catch(() => {}); // silently fail if email is not configured

        res.render('forgot-password', {
          user: null, cartCount: 0, sent: true, flash: null, csrfToken: req.csrfToken(),
        });
      }
    );
  });
});


// =============================================================
// RESET PASSWORD  GET /reset-password  POST /reset-password
// The page the user lands on after clicking the email link.
// =============================================================
app.get('/reset-password', isGuest, csrfProtection, (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect('/forgot-password');

  // Check the token exists in DB and hasn't expired
  db.query(
    'SELECT idU FROM Users WHERE resetToken = ? AND resetExpires > ?',
    [token, Date.now()],
    (err, rows) => {
      const invalid = err || !rows.length;
      res.render('reset-password', {
        user:      null,
        cartCount: 0,
        flash:     invalid ? { type: 'danger', msg: 'This reset link is invalid or has expired.' } : null,
        token:     invalid ? null : token,
        csrfToken: req.csrfToken(),
      });
    }
  );
});

app.post('/reset-password', isGuest, csrfProtection, async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || password.length < 8 || password !== confirmPassword) {
    return res.render('reset-password', {
      user:      null,
      cartCount: 0,
      flash:     { type: 'danger', msg: 'Passwords must match and be at least 8 characters.' },
      token:     token || null,
      csrfToken: req.csrfToken(),
    });
  }

  db.query(
    'SELECT idU FROM Users WHERE resetToken = ? AND resetExpires > ?',
    [token, Date.now()],
    async (err, rows) => {
      if (err || !rows.length) {
        return res.render('reset-password', {
          user: null, cartCount: 0,
          flash: { type: 'danger', msg: 'This reset link is invalid or has expired.' },
          token: null, csrfToken: req.csrfToken(),
        });
      }

      const hashed = await bcrypt.hash(password, 12);

      // Save the new password and clear the reset token so the link can't be reused
      db.query(
        'UPDATE Users SET uPass = ?, resetToken = NULL, resetExpires = NULL WHERE idU = ?',
        [hashed, rows[0].idU],
        (err2) => {
          if (err2) { console.error(err2); return res.status(500).send('Database error'); }
          req.session.flash = { type: 'success', msg: 'Password reset! You can now sign in.' };
          res.redirect('/login');
        }
      );
    }
  );
});


// =============================================================
// CHECKOUT  GET /checkout  POST /checkout
// Collects shipping details and places the order.
// =============================================================
app.get('/checkout', isAuth, csrfProtection, (req, res) => {
  const userId = req.session.user.idU;

  db.query(
    `SELECT sc.idCart, sc.quantity, p.idP, p.labelP, p.priceP, p.photoPath, p.category
     FROM ShopCart sc
     JOIN Products p ON sc.idP = p.idP
     WHERE sc.idU = ?`,
    [userId],
    (err, cartItems) => {
      if (err)               { console.error(err); return res.status(500).send('Database error'); }
      if (!cartItems.length) return res.redirect('/cart'); // nothing in cart → go back

      getCartCount(userId, (__, cartCount) => {
        res.render('checkout', {
          cartItems,
          user:      req.session.user,
          cartCount,
          errors:    [],
          flash:     res.locals.flash,
          csrfToken: req.csrfToken(),
        });
      });
    }
  );
});

app.post('/checkout', isAuth, csrfProtection, (req, res) => {
  const { firstName, lastName, email, phone, shippingAddress } = req.body;
  const userId = req.session.user.idU;
  const errors = [];

  // Validate all shipping fields on the server
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
            user:      req.session.user,
            cartCount,
            errors,
            flash:     null,
            csrfToken: req.csrfToken(),
          });
        });
      }
    );
  }

  // Always calculate the total from the database — never trust prices sent from the browser
  db.query(
    `SELECT sc.idP, sc.quantity, p.priceP
     FROM ShopCart sc
     JOIN Products p ON sc.idP = p.idP
     WHERE sc.idU = ?`,
    [userId],
    (err, cartItems) => {
      if (err)               { console.error(err); return res.status(500).send('Database error'); }
      if (!cartItems.length) return res.redirect('/cart');

      const total       = cartItems.reduce((sum, item) => sum + parseFloat(item.priceP) * item.quantity, 0);
      const fullAddress = `${firstName} ${lastName}, ${phone || ''}, ${shippingAddress}`;

      // Create the order record
      db.query(
        'INSERT INTO Orders (idU, totalPrice, shippingAddress) VALUES (?, ?, ?)',
        [userId, total.toFixed(2), fullAddress],
        (err2, result) => {
          if (err2) { console.error(err2); return res.status(500).send('Database error'); }

          const orderId    = result.insertId;
          const orderItems = cartItems.map(item => [orderId, item.idP, item.quantity, item.priceP]);

          // Save each product that was ordered
          db.query(
            'INSERT INTO OrderItems (idO, idP, quantity, priceAtTime) VALUES ?',
            [orderItems],
            (err3) => {
              if (err3) { console.error(err3); return res.status(500).send('Database error'); }

              // Empty the cart after the order is placed
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


// =============================================================
// WISHLIST  GET /wishlist  POST /wishlist/add  POST /wishlist/remove/:id
// Lets users save products for later.
// =============================================================
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
          flash:    res.locals.flash,
        });
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

      // INSERT IGNORE skips the insert if the product is already in the wishlist
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


// =============================================================
// ORDER HISTORY  GET /orders
// Shows all past orders for the logged-in user.
// =============================================================
app.get('/orders', isAuth, (req, res) => {
  const userId = req.session.user.idU;

  // GROUP_CONCAT joins multiple rows into one pipe-separated string
  // so we get one row per order instead of one row per item
  db.query(
    `SELECT
       o.idO, o.totalPrice, o.shippingAddress, o.orderStatus, o.createdAt,
       GROUP_CONCAT(p.labelP       SEPARATOR '||') AS itemNames,
       GROUP_CONCAT(oi.quantity    SEPARATOR '||') AS itemQtys,
       GROUP_CONCAT(oi.priceAtTime SEPARATOR '||') AS itemPrices,
       GROUP_CONCAT(p.photoPath    SEPARATOR '||') AS itemPhotos
     FROM Orders o
     JOIN OrderItems oi ON o.idO = oi.idO
     JOIN Products   p  ON oi.idP = p.idP
     WHERE o.idU = ?
     GROUP BY o.idO
     ORDER BY o.createdAt DESC`,
    [userId],
    (err, orders) => {
      if (err) { console.error(err); return res.status(500).send('Database error'); }

      // Split each pipe-separated string back into an array for the template
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
          flash:    res.locals.flash,
        });
      });
    }
  );
});


// =============================================================
// USER PROFILE  GET /profile  POST /profile
// Shows the user's info and lets them edit it or change their password.
// =============================================================
app.get('/profile', isAuth, csrfProtection, (req, res) => {
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
        csrfToken:   req.csrfToken(),
      });
    });
  });
});

app.post('/profile', isAuth, csrfProtection, async (req, res) => {
  const { firstName, lastName, phone, address, currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.session.user.idU;
  const errors = [];

  db.query('SELECT * FROM Users WHERE idU = ?', [userId], async (err, rows) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }

    const currentUser    = rows[0];
    let newHashedPassword = null;

    // Only change the password if the user actually filled in the password section
    if (newPassword) {
      if (!currentPassword) {
        errors.push('Please enter your current password to set a new one.');
      } else {
        const passwordMatches = await bcrypt.compare(currentPassword, currentUser.uPass);
        if (!passwordMatches)                    errors.push('Current password is incorrect.');
        else if (newPassword.length < 8)         errors.push('New password must be at least 8 characters.');
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
          csrfToken:   req.csrfToken(),
        });
      });
    }

    // Build query based on whether the password is being changed or not
    const sql = newHashedPassword
      ? 'UPDATE Users SET firstName=?, lastName=?, phone=?, address=?, uPass=? WHERE idU=?'
      : 'UPDATE Users SET firstName=?, lastName=?, phone=?, address=? WHERE idU=?';

    const params = newHashedPassword
      ? [firstName, lastName, phone || '', address || '', newHashedPassword, userId]
      : [firstName, lastName, phone || '', address || '', userId];

    db.query(sql, params, (err2) => {
      if (err2) { console.error(err2); return res.status(500).send('Database error'); }

      // Update the session so the navbar reflects the new name immediately
      req.session.user.firstName = firstName;
      req.session.user.lastName  = lastName;
      req.session.user.phone     = phone || '';
      req.session.user.address   = address || '';

      req.session.flash = { type: 'success', msg: 'Profile updated successfully!' };
      res.redirect('/profile');
    });
  });
});


// =============================================================
// START THE SERVER
// =============================================================
app.listen(PORT, () => {
  console.log(`TechHub is running → http://localhost:${PORT}`);
});

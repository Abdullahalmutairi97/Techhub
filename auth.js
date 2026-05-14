// auth.js
// Two simple middleware functions used to protect routes.
//
//   isAuth  — only logged-in users can continue; everyone else is sent to /login
//   isGuest — only logged-OUT users can continue; logged-in users are sent home
//             (used on /login and /register so you can't visit them while logged in)

const isAuth  = (req, res, next) => req.session.user ? next() : res.redirect('/login');
const isGuest = (req, res, next) => req.session.user ? res.redirect('/') : next();

module.exports = { isAuth, isGuest };

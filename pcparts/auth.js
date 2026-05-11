const isAuth  = (req, res, next) => req.session.user ? next() : res.redirect('/login');
const isGuest = (req, res, next) => !req.session.user ? next() : res.redirect('/');
module.exports = { isAuth, isGuest };

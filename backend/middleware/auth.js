module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/login');
    },

    ensureRole: (...roles) => {
        return (req, res, next) => {
            if (req.isAuthenticated() && roles.includes(req.user.role)) {
                return next();
            }
            req.flash('error_msg', 'Access Denied');
            res.redirect('/dashboard'); // or back
        }
    },

    forwardAuthenticated: (req, res, next) => {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/dashboard');
    }
};

const validateSession = (req, res, next) => {
    if (!req.session.user) {
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Please login first' });
        }
        return res.redirect('/login');
    }
    
    const timeout = 30 * 60 * 1000;
    if (Date.now() - req.session.lastActivity > timeout) {
        req.session.destroy();
        return res.redirect('/login?timeout=1');
    }
    req.session.lastActivity = Date.now();
    
    next();
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(403).json({ error: 'Access denied' });
            }
            return res.redirect('/login');
        }
        next();
    };
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.redirect('/login');
    }
};

const isStaff = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'staff') {
        next();
    } else {
        res.redirect('/login');
    }
};

module.exports = { validateSession, requireRole, isAdmin, isStaff };
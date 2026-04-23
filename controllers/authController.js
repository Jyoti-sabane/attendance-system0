const User = require('../models/User');

const showLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard');
    }
    res.sendFile('login.html', { root: './public/views' });
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ 
            $or: [{ username: username }, { email: username }] 
        });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password!' });
        }
        
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid username or password!' });
        }
        
        req.session.user = {
            user_id: user._id,
            username: user.username,
            full_name: user.full_name,
            role: user.role
        };
        req.session.lastActivity = Date.now();
        
        res.json({ 
            success: true, 
            role: user.role,
            redirect: user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const showRegister = (req, res) => {
    res.sendFile('register.html', { root: './public/views' });
};

const register = async (req, res) => {
    try {
        const { username, password, confirm_password, email, full_name, role } = req.body;
        
        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match!' });
        }
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists!' });
        }
        
        const user = new User({ username, password, email, full_name, role });
        await user.save();
        
        res.json({ success: true, message: 'Registration successful! You can now login.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login?logout=1');
};

const checkSession = (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
};

module.exports = { showLogin, login, showRegister, register, logout, checkSession };
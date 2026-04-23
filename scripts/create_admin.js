const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

async function createAdmin() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in .env file');
            process.exit(1);
        }
        
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const existing = await User.findOne({ username: 'admin' });
        if (existing) {
            console.log('⚠️ Admin user already exists!');
            process.exit(0);
        }
        
        const admin = new User({
            username: 'admin',
            password: 'admin123',
            email: 'admin@college.edu',
            full_name: 'Administrator',
            role: 'admin'
        });
        
        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        
        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n⚠️ Make sure MongoDB is running!');
        }
    }
}

createAdmin();
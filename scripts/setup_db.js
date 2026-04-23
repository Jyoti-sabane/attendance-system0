const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Subject = require('../models/Subject');

async function setupDatabase() {
    try {
        // Check if MongoDB URI exists
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in .env file');
            console.log('Please create .env file with: MONGODB_URI=mongodb://localhost:27017/attendance_system');
            process.exit(1);
        }
        
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Clear existing data
        await User.deleteMany({});
        await Subject.deleteMany({});
        console.log('✅ Cleared existing collections');
        
        // Create admin user
        const admin = new User({
            username: 'admin',
            password: 'admin123',
            email: 'admin@college.edu',
            full_name: 'Administrator',
            role: 'admin'
        });
        await admin.save();
        console.log('✅ Admin user created - Username: admin, Password: admin123');
        
        // Create sample subjects
        const subjects = [
            { subject_code: 'CS101', subject_name: 'Programming Fundamentals' },
            { subject_code: 'CS102', subject_name: 'Data Structures' },
            { subject_code: 'CS103', subject_name: 'Database Management Systems' },
            { subject_code: 'CS104', subject_name: 'Web Technologies' },
            { subject_code: 'CS105', subject_name: 'Operating Systems' }
        ];
        
        for (const subject of subjects) {
            const newSubject = new Subject(subject);
            await newSubject.save();
        }
        console.log('✅ Sample subjects created');
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📝 Login credentials:');
        console.log('   Admin - Username: admin, Password: admin123');
        console.log('\n🚀 Start the server with: npm run dev');
        
        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n⚠️ Make sure MongoDB is running!');
            console.log('   Start MongoDB:');
            console.log('   - Windows: net start MongoDB');
            console.log('   - Mac: brew services start mongodb-community');
            console.log('   - Linux: sudo systemctl start mongodb');
        }
        process.exit(1);
    }
}

setupDatabase();
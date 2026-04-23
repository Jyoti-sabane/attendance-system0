const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    roll_number: { type: String, required: true, unique: true },
    student_name: { type: String, required: true },
    email: { type: String, default: '' },
    branch: { type: String, default: '' },
    year: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
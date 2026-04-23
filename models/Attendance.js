const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendance_date: { type: Date, required: true },
    attendance_time: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    lecture_number: { type: Number, required: true },
    created_at: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ student_id: 1, subject_id: 1, attendance_date: 1, lecture_number: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
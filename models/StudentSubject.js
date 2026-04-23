const mongoose = require('mongoose');

const studentSubjectSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assigned_at: { type: Date, default: Date.now }
});

studentSubjectSchema.index({ student_id: 1, subject_id: 1 }, { unique: true });

module.exports = mongoose.model('StudentSubject', studentSubjectSchema);
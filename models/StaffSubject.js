const mongoose = require('mongoose');

const staffSubjectSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    assigned_at: { type: Date, default: Date.now }
});

staffSubjectSchema.index({ staff_id: 1, subject_id: 1 }, { unique: true });

module.exports = mongoose.model('StaffSubject', staffSubjectSchema);
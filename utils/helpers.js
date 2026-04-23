const StudentSubject = require('../models/StudentSubject');
const Attendance = require('../models/Attendance');

function sanitize(data) {
    if (typeof data === 'string') {
        return data.trim().replace(/[<>]/g, '');
    }
    return data;
}

function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(month) - 1];
}

async function getStaffSubjects(staff_id) {
    const StaffSubject = require('../models/StaffSubject');
    const Subject = require('../models/Subject');
    
    const assignments = await StaffSubject.find({ staff_id }).populate('subject_id');
    return assignments.map(a => ({
        subject_id: a.subject_id._id,
        subject_code: a.subject_id.subject_code,
        subject_name: a.subject_id.subject_name
    }));
}

async function getStudentsBySubject(subject_id, staff_id) {
    const enrollments = await StudentSubject.find({ subject_id, staff_id }).populate('student_id');
    return enrollments.map(e => e.student_id);
}

async function getAttendancePercentage(student_id, subject_id, month = null, year = null) {
    let query = { student_id, subject_id };
    if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        query.attendance_date = { $gte: startDate, $lte: endDate };
    }
    
    const records = await Attendance.find(query);
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    
    return total > 0 ? (present / total) * 100 : 0;
}

module.exports = {
    sanitize,
    formatDate,
    getMonthName,
    getStaffSubjects,
    getStudentsBySubject,
    getAttendancePercentage
};
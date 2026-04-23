const StaffSubject = require('../models/StaffSubject');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const StudentSubject = require('../models/StudentSubject');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

const showDashboard = async (req, res) => {
    res.sendFile('dashboard.html', { root: './public/views/staff' });
};

const getAssignedSubjects = async (req, res) => {
    try {
        const staff_id = req.session.user.user_id;
        const assignments = await StaffSubject.find({ staff_id }).populate('subject_id');
        const subjects = assignments.map(a => ({
            subject_id: a.subject_id._id,
            subject_code: a.subject_id.subject_code,
            subject_name: a.subject_id.subject_name
        }));
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const showAssignStudents = (req, res) => {
    res.sendFile('assign_students.html', { root: './public/views/staff' });
};

const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ roll_number: 1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const assignStudentsToSubject = async (req, res) => {
    try {
        const { subject_id, students } = req.body;
        const staff_id = req.session.user.user_id;
        
        let success_count = 0;
        
        for (const student_id of students) {
            const existing = await StudentSubject.findOne({ student_id, subject_id });
            if (!existing) {
                const assignment = new StudentSubject({ student_id, subject_id, staff_id });
                await assignment.save();
                success_count++;
            }
        }
        
        res.json({ success: true, message: `${success_count} student(s) assigned successfully!` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAssignedStudents = async (req, res) => {
    try {
        const staff_id = req.session.user.user_id;
        const assignments = await StudentSubject.find({ staff_id })
            .populate('student_id', 'roll_number student_name')
            .populate('subject_id', 'subject_code subject_name');
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const showMarkAttendance = (req, res) => {
    res.sendFile('mark_attendance.html', { root: './public/views/staff' });
};

const getSubjectStudents = async (req, res) => {
    try {
        const { subject_id } = req.params;
        const staff_id = req.session.user.user_id;
        
        const students = await StudentSubject.find({ subject_id, staff_id })
            .populate('student_id');
        
        // Get existing attendance for today's date to show current status
        const today = new Date().toISOString().split('T')[0];
        const existingAttendance = await Attendance.find({
            subject_id,
            attendance_date: { $gte: new Date(today), $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1)) }
        });
        
        const attendanceMap = {};
        for (const att of existingAttendance) {
            attendanceMap[att.student_id.toString()] = att.status;
        }
        
        const result = students.map(s => ({
            _id: s.student_id._id,
            roll_number: s.student_id.roll_number,
            student_name: s.student_id.student_name,
            current_status: attendanceMap[s.student_id._id.toString()] || null
        }));
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// FIXED: Save attendance with proper error handling
const saveAttendance = async (req, res) => {
    try {
        const { subject_id, attendance_date, lecture_number, attendance } = req.body;
        const staff_id = req.session.user.user_id;
        const attendance_time = new Date().toLocaleTimeString();
        
        let success_count = 0;
        let error_count = 0;
        
        for (const [student_id, status] of Object.entries(attendance)) {
            try {
                // Check if attendance already exists for this student, subject, date and lecture
                const existing = await Attendance.findOne({
                    student_id,
                    subject_id,
                    attendance_date: new Date(attendance_date),
                    lecture_number: parseInt(lecture_number)
                });
                
                if (existing) {
                    // Update existing record
                    existing.status = status;
                    existing.attendance_time = attendance_time;
                    await existing.save();
                    success_count++;
                } else {
                    // Create new record
                    const record = new Attendance({
                        student_id,
                        subject_id,
                        staff_id,
                        attendance_date: new Date(attendance_date),
                        attendance_time,
                        status,
                        lecture_number: parseInt(lecture_number)
                    });
                    await record.save();
                    success_count++;
                }
            } catch (err) {
                console.error(`Error saving attendance for student ${student_id}:`, err);
                error_count++;
            }
        }
        
        if (success_count > 0) {
            res.json({ success: true, message: `Attendance marked successfully for ${success_count} students!${error_count > 0 ? ` (${error_count} failed)` : ''}` });
        } else {
            res.status(500).json({ error: 'Failed to mark attendance' });
        }
    } catch (error) {
        console.error('Save attendance error:', error);
        res.status(500).json({ error: error.message });
    }
};

const showViewAttendance = (req, res) => {
    res.sendFile('view_attendance.html', { root: './public/views/staff' });
};

// FIXED: Calculate attendance percentage correctly based on total lectures
const getAttendanceReport = async (req, res) => {
    try {
        const { subject_id, month, year } = req.query;
        const staff_id = req.session.user.user_id;
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        // Get all students enrolled in this subject
        const students = await StudentSubject.find({ subject_id, staff_id })
            .populate('student_id');
        
        // Get ALL lectures conducted for this subject in the selected month
        // Count distinct combinations of date and lecture_number
        const allLectures = await Attendance.aggregate([
            {
                $match: {
                    subject_id: new mongoose.Types.ObjectId(subject_id),
                    attendance_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$attendance_date" } },
                        lecture: "$lecture_number"
                    }
                }
            }
        ]);
        
        const totalLectures = allLectures.length;
        
        const report = [];
        for (const enrollment of students) {
            const student = enrollment.student_id;
            
            // Get attendance records for this student
            const attendanceRecords = await Attendance.find({
                student_id: student._id,
                subject_id,
                attendance_date: { $gte: startDate, $lte: endDate }
            });
            
            const totalPresent = attendanceRecords.filter(a => a.status === 'present').length;
            
            // Calculate percentage based on TOTAL lectures conducted
            let percentage = 0;
            if (totalLectures > 0) {
                percentage = (totalPresent / totalLectures) * 100;
                if (percentage > 100) percentage = 100;
            }
            
            report.push({
                roll_number: student.roll_number,
                student_name: student.student_name,
                total_present: totalPresent,
                total_days: totalLectures,
                percentage: percentage.toFixed(2)
            });
        }
        
        res.json({ report, total_lectures: totalLectures });
    } catch (error) {
        console.error('Get attendance report error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    showDashboard,
    getAssignedSubjects,
    showAssignStudents,
    getAllStudents,
    assignStudentsToSubject,
    getAssignedStudents,
    showMarkAttendance,
    getSubjectStudents,
    saveAttendance,
    showViewAttendance,
    getAttendanceReport
};
const Student = require('../models/Student');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const StaffSubject = require('../models/StaffSubject');
const StudentSubject = require('../models/StudentSubject');

// Helper function
function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(month) - 1];
}

const showDashboard = async (req, res) => {
    res.sendFile('dashboard.html', { root: './public/views/admin' });
};

const getDashboardStats = async (req, res) => {
    try {
        const student_count = await Student.countDocuments();
        const staff_count = await User.countDocuments({ role: 'staff' });
        const subject_count = await Subject.countDocuments();
        const attendance_count = await Attendance.countDocuments();
        
        res.json({ student_count, staff_count, subject_count, attendance_count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const showManageStudents = (req, res) => {
    res.sendFile('manage_students.html', { root: './public/views/admin' });
};

const getStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ roll_number: 1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const showAddStudent = (req, res) => {
    res.sendFile('add_student.html', { root: './public/views/admin' });
};

const addStudent = async (req, res) => {
    try {
        const { roll_number, student_name, email, branch, year } = req.body;
        
        const existing = await Student.findOne({ roll_number });
        if (existing) {
            return res.status(400).json({ error: 'Roll number already exists!' });
        }
        
        const student = new Student({ roll_number, student_name, email, branch, year });
        await student.save();
        
        res.json({ success: true, message: 'Student added successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const showEditStudent = (req, res) => {
    res.sendFile('edit_student.html', { root: './public/views/admin' });
};

const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStudent = async (req, res) => {
    try {
        const { roll_number, student_name, email, branch, year } = req.body;
        
        await Student.findByIdAndUpdate(req.params.id, {
            roll_number, student_name, email, branch, year
        });
        
        res.json({ success: true, message: 'Student updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        await StudentSubject.deleteMany({ student_id: req.params.id });
        await Attendance.deleteMany({ student_id: req.params.id });
        
        res.json({ success: true, message: 'Student deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const showViewAttendance = (req, res) => {
    res.sendFile('view_attendance.html', { root: './public/views/admin' });
};

const getAttendanceRecords = async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const students = await Student.find().sort({ roll_number: 1 });
        
        const records = [];
        for (const student of students) {
            const attendance = await Attendance.find({
                student_id: student._id,
                attendance_date: { $gte: startDate, $lte: endDate }
            });
            
            const total_attendance = attendance.filter(a => a.status === 'present').length;
            const total_days = attendance.length;
            let percentage = total_days > 0 ? (total_attendance / total_days) * 100 : 0;
            if (percentage > 100) percentage = 100;
            
            records.push({
                id: student._id,
                roll_number: student.roll_number,
                student_name: student.student_name,
                branch: student.branch,
                year: student.year,
                total_attendance,
                total_days,
                percentage: percentage.toFixed(2)
            });
        }
        
        res.json({ students: records, month, year });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const showAssignStaffSubjects = (req, res) => {
    res.sendFile('assign_staff_subjects.html', { root: './public/views/admin' });
};

const getStaffMembers = async (req, res) => {
    try {
        const staff = await User.find({ role: 'staff' }).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ subject_code: 1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const assignStaffToSubject = async (req, res) => {
    try {
        const { staff_id, subject_id } = req.body;
        
        const existing = await StaffSubject.findOne({ staff_id, subject_id });
        if (existing) {
            return res.status(400).json({ error: 'Teacher already assigned to this subject!' });
        }
        
        const assignment = new StaffSubject({ staff_id, subject_id });
        await assignment.save();
        
        res.json({ success: true, message: 'Teacher assigned to subject successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAssignments = async (req, res) => {
    try {
        const assignments = await StaffSubject.find()
            .populate('staff_id', 'full_name username')
            .populate('subject_id', 'subject_code subject_name');
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const removeAssignment = async (req, res) => {
    try {
        await StaffSubject.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Assignment removed successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATED: Excel Export - With FULL SUBJECT NAMES as Headings
const generateExcelReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthName = getMonthName(month);
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const subjects = await Subject.find().sort({ subject_code: 1 });
        const students = await Student.find().sort({ roll_number: 1 });
        
        // Get student-subject enrollments
        const enrollments = await StudentSubject.find();
        const enrollmentMap = {};
        for (const e of enrollments) {
            if (!enrollmentMap[e.student_id]) {
                enrollmentMap[e.student_id] = [];
            }
            enrollmentMap[e.student_id].push(e.subject_id.toString());
        }
        
        // Create HTML table for Excel - WITH FULL SUBJECT NAMES
        let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Attendance Report - ${monthName} ${year}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h2 { color: #333; }
                    .info { margin-bottom: 20px; padding: 10px; background: #f0f0f0; border-left: 4px solid #4CAF50; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th { background-color: #4CAF50; color: white; padding: 12px; border: 1px solid #ddd; text-align: center; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                    td:first-child, td:nth-child(2), td:nth-child(3) { text-align: left; }
                    .percentage-high { color: #28a745; font-weight: bold; }
                    .percentage-medium { color: #ff9800; font-weight: bold; }
                    .percentage-low { color: #dc3545; font-weight: bold; }
                    .not-enrolled { color: #999; font-style: italic; }
                </style>
            </head>
            <body>
                <h2>Attendance Report - ${monthName} ${year}</h2>
                <div class="info">
                    <strong>Generated on:</strong> ${new Date().toLocaleString()}<br>
                    <strong>Total Students:</strong> ${students.length}<br>
                    <strong>Total Subjects:</strong> ${subjects.length}<br>
                    <strong>Note:</strong> "-" indicates student is not enrolled in that subject
                </div>
                <table border="1">
                    <thead>
                        <tr>
                            <th rowspan="2">Roll Number</th>
                            <th rowspan="2">Student Name</th>
                            <th rowspan="2">Branch</th>
                            <th rowspan="2">Year</th>
        `;
        
        // Add subject names as column headers
        for (const subject of subjects) {
            html += `<th colspan="1">${this.escapeHtml(subject.subject_name)}<br><small>(${subject.subject_code})</small></th>`;
        }
        html += `<th rowspan="2">Overall<br>Average</th>`;
        html += `</tr>`;
        html += `<tr>`;
        for (const subject of subjects) {
            html += `<th>Percentage (%)</th>`;
        }
        html += `</tr>`;
        html += `</thead><tbody>`;
        
        for (const student of students) {
            html += `<tr>`;
            html += `<td>${this.escapeHtml(student.roll_number)}</td>`;
            html += `<td style="text-align: left;">${this.escapeHtml(student.student_name)}</td>`;
            html += `<td style="text-align: left;">${this.escapeHtml(student.branch || '-')}</td>`;
            html += `<td>${student.year}</td>`;
            
            let totalPercentage = 0;
            let enrolledCount = 0;
            const studentEnrollments = enrollmentMap[student._id] || [];
            
            for (const subject of subjects) {
                const isEnrolled = studentEnrollments.includes(subject._id.toString());
                
                if (isEnrolled) {
                    const attendance = await Attendance.find({
                        student_id: student._id,
                        subject_id: subject._id,
                        attendance_date: { $gte: startDate, $lte: endDate }
                    });
                    
                    const present = attendance.filter(a => a.status === 'present').length;
                    const total = attendance.length;
                    let percentage = total > 0 ? (present / total) * 100 : 0;
                    if (percentage > 100) percentage = 100;
                    
                    let pClass = '';
                    if (percentage >= 75) pClass = 'percentage-high';
                    else if (percentage >= 60) pClass = 'percentage-medium';
                    else if (percentage > 0) pClass = 'percentage-low';
                    
                    html += `<td class="${pClass}">${percentage.toFixed(2)}%</td>`;
                    
                    if (total > 0) {
                        totalPercentage += percentage;
                        enrolledCount++;
                    }
                } else {
                    html += `<td class="not-enrolled">-</td>`;
                }
            }
            
            const overall = enrolledCount > 0 ? (totalPercentage / enrolledCount).toFixed(2) : 0;
            let oClass = '';
            if (overall >= 75) oClass = 'percentage-high';
            else if (overall >= 60) oClass = 'percentage-medium';
            else if (overall > 0) oClass = 'percentage-low';
            
            html += `<td class="${oClass}">${overall > 0 ? overall + '%' : '-'}</td>`;
            html += `</tr>`;
        }
        
        html += `</tbody>
                </table>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">
                    <em>Note: "-" indicates student is not enrolled in that subject</em>
                </p>
            </body>
            </html>`;
        
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${monthName}_${year}.xls`);
        res.send(html);
        
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).send('Error generating report: ' + error.message);
    }
};

// Add escapeHtml helper method
generateExcelReport.escapeHtml = function(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
};

// UPDATED: CSV Export - With FULL SUBJECT NAMES as Headings
const generateCSVReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthName = getMonthName(month);
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const subjects = await Subject.find().sort({ subject_code: 1 });
        const students = await Student.find().sort({ roll_number: 1 });
        
        // Get student-subject enrollments
        const enrollments = await StudentSubject.find();
        const enrollmentMap = {};
        for (const e of enrollments) {
            if (!enrollmentMap[e.student_id]) {
                enrollmentMap[e.student_id] = [];
            }
            enrollmentMap[e.student_id].push(e.subject_id.toString());
        }
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${monthName}_${year}.csv`);
        
        // Add BOM for UTF-8
        res.write('\uFEFF');
        
        // Create headers - WITH FULL SUBJECT NAMES
        let headers = ['Roll Number', 'Student Name', 'Branch', 'Year'];
        for (const subject of subjects) {
            headers.push(`${subject.subject_name} (${subject.subject_code}) (%)`);
        }
        headers.push('Overall Average (%)');
        
        res.write(headers.join(',') + '\n');
        
        for (const student of students) {
            const row = [
                `"${student.roll_number}"`,
                `"${student.student_name}"`,
                `"${student.branch || '-'}"`,
                student.year
            ];
            
            let totalPercentage = 0;
            let enrolledCount = 0;
            const studentEnrollments = enrollmentMap[student._id] || [];
            
            for (const subject of subjects) {
                const isEnrolled = studentEnrollments.includes(subject._id.toString());
                
                if (isEnrolled) {
                    const attendance = await Attendance.find({
                        student_id: student._id,
                        subject_id: subject._id,
                        attendance_date: { $gte: startDate, $lte: endDate }
                    });
                    
                    const present = attendance.filter(a => a.status === 'present').length;
                    const total = attendance.length;
                    let percentage = total > 0 ? (present / total) * 100 : 0;
                    if (percentage > 100) percentage = 100;
                    
                    row.push(`"${percentage.toFixed(2)}%"`);
                    
                    if (total > 0) {
                        totalPercentage += percentage;
                        enrolledCount++;
                    }
                } else {
                    row.push('"-"');
                }
            }
            
            const overall = enrolledCount > 0 ? (totalPercentage / enrolledCount).toFixed(2) : 0;
            row.push(`"${overall > 0 ? overall + '%' : '-'}"`);
            
            res.write(row.join(',') + '\n');
        }
        
        res.end();
        
    } catch (error) {
        console.error('CSV generation error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Fix for this keyword in escapeHtml
const escapeHtml = (text) => {
    if (!text) return '';
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
};

// Update the generateExcelReport to use the external escapeHtml function
const generateExcelReportFixed = async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthName = getMonthName(month);
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const subjects = await Subject.find().sort({ subject_code: 1 });
        const students = await Student.find().sort({ roll_number: 1 });
        
        // Get student-subject enrollments
        const enrollments = await StudentSubject.find();
        const enrollmentMap = {};
        for (const e of enrollments) {
            if (!enrollmentMap[e.student_id]) {
                enrollmentMap[e.student_id] = [];
            }
            enrollmentMap[e.student_id].push(e.subject_id.toString());
        }
        
        // Create HTML table for Excel - WITH FULL SUBJECT NAMES
        let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Attendance Report - ${monthName} ${year}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h2 { color: #333; }
                    .info { margin-bottom: 20px; padding: 10px; background: #f0f0f0; border-left: 4px solid #4CAF50; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th { background-color: #4CAF50; color: white; padding: 12px; border: 1px solid #ddd; text-align: center; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                    td:first-child, td:nth-child(2), td:nth-child(3) { text-align: left; }
                    .percentage-high { color: #28a745; font-weight: bold; }
                    .percentage-medium { color: #ff9800; font-weight: bold; }
                    .percentage-low { color: #dc3545; font-weight: bold; }
                    .not-enrolled { color: #999; font-style: italic; }
                </style>
            </head>
            <body>
                <h2>Attendance Report - ${monthName} ${year}</h2>
                <div class="info">
                    <strong>Generated on:</strong> ${new Date().toLocaleString()}<br>
                    <strong>Total Students:</strong> ${students.length}<br>
                    <strong>Total Subjects:</strong> ${subjects.length}<br>
                    <strong>Note:</strong> "-" indicates student is not enrolled in that subject
                </div>
                <table border="1">
                    <thead>
                        <tr>
                            <th rowspan="2">Roll Number</th>
                            <th rowspan="2">Student Name</th>
                            <th rowspan="2">Branch</th>
                            <th rowspan="2">Year</th>`;
        
        // Add subject names as column headers
        for (const subject of subjects) {
            html += `<th colspan="1">${escapeHtml(subject.subject_name)}<br><small>(${subject.subject_code})</small></th>`;
        }
        html += `<th rowspan="2">Overall<br>Average</th>
                         </tr>
                         <tr>`;
        for (const subject of subjects) {
            html += `<th>Percentage (%)</th>`;
        }
        html += `</tr>
                    </thead>
                    <tbody>`;
        
        for (const student of students) {
            html += `<tr>`;
            html += `<td>${escapeHtml(student.roll_number)}</td>`;
            html += `<td style="text-align: left;">${escapeHtml(student.student_name)}</td>`;
            html += `<td style="text-align: left;">${escapeHtml(student.branch || '-')}</td>`;
            html += `<td>${student.year}</td>`;
            
            let totalPercentage = 0;
            let enrolledCount = 0;
            const studentEnrollments = enrollmentMap[student._id] || [];
            
            for (const subject of subjects) {
                const isEnrolled = studentEnrollments.includes(subject._id.toString());
                
                if (isEnrolled) {
                    const attendance = await Attendance.find({
                        student_id: student._id,
                        subject_id: subject._id,
                        attendance_date: { $gte: startDate, $lte: endDate }
                    });
                    
                    const present = attendance.filter(a => a.status === 'present').length;
                    const total = attendance.length;
                    let percentage = total > 0 ? (present / total) * 100 : 0;
                    if (percentage > 100) percentage = 100;
                    
                    let pClass = '';
                    if (percentage >= 75) pClass = 'percentage-high';
                    else if (percentage >= 60) pClass = 'percentage-medium';
                    else if (percentage > 0) pClass = 'percentage-low';
                    
                    html += `<td class="${pClass}">${percentage.toFixed(2)}%</td>`;
                    
                    if (total > 0) {
                        totalPercentage += percentage;
                        enrolledCount++;
                    }
                } else {
                    html += `<td class="not-enrolled">-</td>`;
                }
            }
            
            const overall = enrolledCount > 0 ? (totalPercentage / enrolledCount).toFixed(2) : 0;
            let oClass = '';
            if (overall >= 75) oClass = 'percentage-high';
            else if (overall >= 60) oClass = 'percentage-medium';
            else if (overall > 0) oClass = 'percentage-low';
            
            html += `<td class="${oClass}">${overall > 0 ? overall + '%' : '-'}</td>`;
            html += `</tr>`;
        }
        
        html += `</tbody>
                </table>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">
                    <em>Note: "-" indicates student is not enrolled in that subject</em>
                </p>
            </body>
            </html>`;
        
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${monthName}_${year}.xls`);
        res.send(html);
        
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).send('Error generating report: ' + error.message);
    }
};

module.exports = {
    showDashboard,
    getDashboardStats,
    showManageStudents,
    getStudents,
    showAddStudent,
    addStudent,
    showEditStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
    showViewAttendance,
    getAttendanceRecords,
    showAssignStaffSubjects,
    getStaffMembers,
    getAllSubjects,
    assignStaffToSubject,
    getAssignments,
    removeAssignment,
    generateExcelReport: generateExcelReportFixed,
    generateCSVReport
};
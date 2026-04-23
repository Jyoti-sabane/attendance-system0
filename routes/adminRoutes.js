const express = require('express');
const router = express.Router();
const { isAdmin, validateSession } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(validateSession);
router.use(isAdmin);

// Page routes
router.get('/dashboard', adminController.showDashboard);
router.get('/manage_students', adminController.showManageStudents);
router.get('/add_student', adminController.showAddStudent);
router.get('/edit_student', adminController.showEditStudent);
router.get('/view_attendance', adminController.showViewAttendance);
router.get('/assign_staff_subjects', adminController.showAssignStaffSubjects);

// API routes
router.get('/api/stats', adminController.getDashboardStats);
router.get('/api/students', adminController.getStudents);
router.post('/api/students', adminController.addStudent);
router.get('/api/students/:id', adminController.getStudentById);
router.put('/api/students/:id', adminController.updateStudent);
router.delete('/api/students/:id', adminController.deleteStudent);
router.get('/api/attendance', adminController.getAttendanceRecords);
router.get('/api/staff', adminController.getStaffMembers);
router.get('/api/subjects', adminController.getAllSubjects);
router.post('/api/assign-staff', adminController.assignStaffToSubject);
router.get('/api/assignments', adminController.getAssignments);
router.delete('/api/assignments/:id', adminController.removeAssignment);

// Export routes - FIXED
router.get('/api/export-excel', adminController.generateExcelReport);
router.get('/api/export-csv', adminController.generateCSVReport);

module.exports = router;
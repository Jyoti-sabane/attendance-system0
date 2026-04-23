const express = require('express');
const router = express.Router();
const { isStaff, validateSession } = require('../middleware/auth');
const staffController = require('../controllers/staffController');

router.use(validateSession);
router.use(isStaff);

router.get('/dashboard', staffController.showDashboard);
router.get('/assign_students', staffController.showAssignStudents);
router.get('/mark_attendance', staffController.showMarkAttendance);
router.get('/view_attendance', staffController.showViewAttendance);

router.get('/api/subjects', staffController.getAssignedSubjects);
router.get('/api/students/all', staffController.getAllStudents);
router.post('/api/assign-students', staffController.assignStudentsToSubject);
router.get('/api/assigned-students', staffController.getAssignedStudents);
router.get('/api/subjects/:subject_id/students', staffController.getSubjectStudents);
router.post('/api/attendance', staffController.saveAttendance);
router.get('/api/attendance-report', staffController.getAttendanceReport);

module.exports = router;
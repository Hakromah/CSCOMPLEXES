/**
 * school-admin router
 * All routes require ADMIN role (schoolRole === 'ADMIN')
 */

export default {
  routes: [
    // Users
    { method: 'GET',    path: '/admin/users',                      handler: 'school-admin.getAllUsers' },
    { method: 'POST',   path: '/admin/users',                      handler: 'school-admin.createUser' },
    { method: 'POST',   path: '/admin/users/bulk',                 handler: 'school-admin.bulkCreateUsers' },
    { method: 'PUT',    path: '/admin/users/:id',                  handler: 'school-admin.updateUser' },
    { method: 'DELETE', path: '/admin/users/:id',                  handler: 'school-admin.deleteUser' },

    // Classes
    { method: 'GET',    path: '/admin/classes',                    handler: 'school-admin.getAllClasses' },
    { method: 'POST',   path: '/admin/classes',                    handler: 'school-admin.createClass' },
    { method: 'PUT',    path: '/admin/classes/:id',                handler: 'school-admin.updateClass' },
    { method: 'DELETE', path: '/admin/classes/:id',                handler: 'school-admin.deleteClass' },
    { method: 'POST',   path: '/admin/assign-teacher',             handler: 'school-admin.assignTeacher' },
    { method: 'POST',   path: '/admin/assign-student',             handler: 'school-admin.assignStudent' },
    { method: 'GET',    path: '/admin/students/:studentId/classes', handler: 'school-admin.getClassesForStudent' },

    // Subjects
    { method: 'GET',    path: '/admin/subjects',                   handler: 'school-admin.getAllSubjects' },
    { method: 'POST',   path: '/admin/subjects',                   handler: 'school-admin.createSubject' },
    { method: 'PUT',    path: '/admin/subjects/:id',               handler: 'school-admin.updateSubject' },
    { method: 'DELETE', path: '/admin/subjects/:id',               handler: 'school-admin.deleteSubject' },

    // Learning Materials
    { method: 'GET',    path: '/admin/materials',                  handler: 'school-admin.getAllMaterials' },
    { method: 'POST',   path: '/admin/materials',                  handler: 'school-admin.createMaterial' },
    { method: 'DELETE', path: '/admin/materials/:id',              handler: 'school-admin.deleteMaterial' },
    { method: 'GET',    path: '/admin/materials/analytics',        handler: 'school-admin.getMaterialAnalytics' },

    // Timetables
    { method: 'GET',    path: '/admin/timetables',                 handler: 'school-admin.getAllTimetables' },
    { method: 'POST',   path: '/admin/timetables',                 handler: 'school-admin.createTimetable' },
    { method: 'PUT',    path: '/admin/timetables/:id',             handler: 'school-admin.updateTimetable' },
    { method: 'DELETE', path: '/admin/timetables/:id',             handler: 'school-admin.deleteTimetable' },

    // Exams
    { method: 'GET',    path: '/admin/exams',                      handler: 'school-admin.getExams' },
    { method: 'PATCH',  path: '/admin/exams/lock-semester',        handler: 'school-admin.lockSemesterExams' },

    // Results & Reports
    { method: 'GET',    path: '/admin/results/filter',             handler: 'school-admin.filterResults' },
    { method: 'GET',    path: '/admin/reports/summary',            handler: 'school-admin.getSummaryReport' },
    { method: 'GET',    path: '/admin/reports/semester-summary',   handler: 'school-admin.getSemesterGPA' },
    { method: 'PUT',    path: '/admin/semester/finalize',          handler: 'school-admin.finalizeSemester' },
    { method: 'PUT',    path: '/admin/semester/lock',              handler: 'school-admin.finalizeSemester' },
    { method: 'GET',    path: '/admin/transcripts/generate',       handler: 'school-admin.generateTranscript' },
    { method: 'GET',    path: '/admin/transcripts/student/:studentId', handler: 'school-admin.getStudentTranscriptsList' },

    // Profile & Password
    { method: 'PUT',    path: '/admin/profile',                    handler: 'school-admin.updateProfile' },
    { method: 'PUT',    path: '/admin/change-password',            handler: 'school-admin.changePassword' },

    // Attendance (admin read-only + analytics)
    // auth:false + manual ADMIN check so these work without Strapi panel permission grants
    { method: 'GET',    path: '/admin/attendance',           handler: 'school-admin.getAttendanceSessions',   config: { auth: false } },
    { method: 'GET',    path: '/admin/attendance/analytics', handler: 'school-admin.getAttendanceAnalytics',  config: { auth: false } },
    { method: 'DELETE', path: '/admin/attendance/:id',       handler: 'school-admin.deleteAttendanceSession', config: { auth: false } },
  ],
};

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
    { method: 'POST',   path: '/admin/assign-teacher',             handler: 'school-admin.assignTeacher', config: { auth: false } },
    { method: 'POST',   path: '/admin/assign-student',             handler: 'school-admin.assignStudent', config: { auth: false } },
    { method: 'GET',    path: '/admin/teachers/:teacherId/classes', handler: 'school-admin.getClassesForTeacher', config: { auth: false } },
    { method: 'GET',    path: '/admin/students/:studentId/classes', handler: 'school-admin.getClassesForStudent', config: { auth: false } },
    { method: 'POST',   path: '/admin/unassign-teacher',           handler: 'school-admin.unassignTeacher', config: { auth: false } },
    { method: 'POST',   path: '/admin/unassign-student',           handler: 'school-admin.unassignStudent', config: { auth: false } },

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
    { method: 'POST',   path: '/admin/timetables/validate',        handler: 'school-admin.validateTimetable' },
    { method: 'POST',   path: '/admin/timetables/audit',           handler: 'school-admin.auditTimetable' },
    { method: 'POST',   path: '/admin/timetables/duplicate-day',   handler: 'school-admin.duplicateDay' },
    { method: 'POST',   path: '/admin/timetables/duplicate-class', handler: 'school-admin.duplicateClass' },
    { method: 'POST',   path: '/admin/timetables/duplicate-term',  handler: 'school-admin.duplicateTerm' },
    { method: 'POST',   path: '/admin/timetables/publish',         handler: 'school-admin.publishTimetable' },
    { method: 'POST',   path: '/admin/timetables/bulk-delete',     handler: 'school-admin.bulkDeleteTimetable' },
    { method: 'GET',    path: '/admin/timetables/analytics',       handler: 'school-admin.getTimetableAnalytics' },

    // Rooms
    { method: 'GET',    path: '/admin/rooms',                      handler: 'school-admin.getAllRooms' },
    { method: 'POST',   path: '/admin/rooms',                      handler: 'school-admin.createRoom' },
    { method: 'PUT',    path: '/admin/rooms/:id',                  handler: 'school-admin.updateRoom' },
    { method: 'DELETE', path: '/admin/rooms/:id',                  handler: 'school-admin.deleteRoom' },

    // Time Slots
    { method: 'GET',    path: '/admin/time-slots',                 handler: 'school-admin.getAllTimeSlots' },
    { method: 'POST',   path: '/admin/time-slots',                 handler: 'school-admin.createTimeSlot' },
    { method: 'PUT',    path: '/admin/time-slots/:id',             handler: 'school-admin.updateTimeSlot' },
    { method: 'DELETE', path: '/admin/time-slots/:id',             handler: 'school-admin.deleteTimeSlot' },

    // Exams
    { method: 'GET',    path: '/admin/exams',                      handler: 'school-admin.getExams' },
    { method: 'PATCH',  path: '/admin/exams/lock-semester',        handler: 'school-admin.lockSemesterExams' },

    // Results & Reports
    { method: 'GET',    path: '/admin/results/filter',             handler: 'school-admin.filterResults' },
    { method: 'GET',    path: '/admin/reports/summary',            handler: 'school-admin.getSummaryReport' },
    { method: 'GET',    path: '/admin/reports/semester-summary',   handler: 'school-admin.getSemesterGPA' },
    { method: 'PUT',    path: '/admin/semester/finalize',          handler: 'school-admin.finalizeSemester' },
    { method: 'GET',    path: '/admin/transcripts/generate',       handler: 'school-admin.generateTranscript' },
    { method: 'GET',    path: '/admin/transcripts/student/:studentId', handler: 'school-admin.getStudentTranscriptsList' },
    { method: 'DELETE', path: '/admin/transcripts/:id',            handler: 'school-admin.deleteTranscript', config: { auth: false } },

    // Profile & Password
    { method: 'PUT',    path: '/admin/profile',                    handler: 'school-admin.updateProfile' },
    { method: 'PUT',    path: '/admin/change-password',            handler: 'school-admin.changePassword' },

    // Attendance (admin read-only + analytics)
    { method: 'GET',    path: '/admin/attendance',           handler: 'school-admin.getAttendanceSessions',   config: { auth: false } },
    { method: 'GET',    path: '/admin/attendance/analytics', handler: 'school-admin.getAttendanceAnalytics',  config: { auth: false } },

    // Parents & Notifications
    { method: 'GET',    path: '/admin/parents',                    handler: 'school-admin.getAllParents' },
    { method: 'POST',   path: '/admin/parents',                    handler: 'school-admin.createParent' },
    { method: 'POST',   path: '/admin/notifications/send',         handler: 'school-admin.sendAdminNotification' },
    { method: 'POST',   path: '/admin/notifications/broadcast',    handler: 'school-admin.broadcastAdminAnnouncement' },

    // Assessment Engine — Auto-transcript
    { method: 'GET',    path: '/admin/transcripts/auto',                     handler: 'school-admin.generateTranscriptAuto' },

    // Assessment Categories
    { method: 'GET',    path: '/admin/assessment-categories',                handler: 'school-admin.getAssessmentCategories' },
    { method: 'POST',   path: '/admin/assessment-categories',                handler: 'school-admin.createAssessmentCategory' },
    { method: 'PUT',    path: '/admin/assessment-categories/:id',             handler: 'school-admin.updateAssessmentCategory' },
    { method: 'DELETE', path: '/admin/assessment-categories/:id',             handler: 'school-admin.deleteAssessmentCategory' },

    // Assessment Blueprints
    { method: 'GET',    path: '/admin/assessment-blueprints',                 handler: 'school-admin.getAssessmentBlueprints' },
    { method: 'POST',   path: '/admin/assessment-blueprints',                 handler: 'school-admin.createAssessmentBlueprint' },
    { method: 'PUT',    path: '/admin/assessment-blueprints/:id',              handler: 'school-admin.updateAssessmentBlueprint' },
    { method: 'DELETE', path: '/admin/assessment-blueprints/:id',              handler: 'school-admin.deleteAssessmentBlueprint' },

    // Grading Schemes
    { method: 'GET',    path: '/admin/grading-schemes',                       handler: 'school-admin.getGradingSchemes' },
    { method: 'POST',   path: '/admin/grading-schemes',                       handler: 'school-admin.createGradingScheme' },
    { method: 'PUT',    path: '/admin/grading-schemes/:id',                   handler: 'school-admin.updateGradingScheme' },
    { method: 'DELETE', path: '/admin/grading-schemes/:id',                   handler: 'school-admin.deleteGradingScheme' },

    // Academic Results
    { method: 'GET',    path: '/admin/academic-results/student/:studentId',   handler: 'school-admin.getStudentAcademicResults' },
    { method: 'GET',    path: '/admin/academic-results/class/:classId',       handler: 'school-admin.getClassAcademicResults' },

    // Recalculate triggers
    { method: 'POST',   path: '/admin/recalculate/student/:studentId',        handler: 'school-admin.recalculateStudent' },
    { method: 'POST',   path: '/admin/recalculate/class/:classId',            handler: 'school-admin.recalculateClass' },

    // Dynamic Gradebook
    { method: 'GET',    path: '/admin/gradebook/:classId',                    handler: 'school-admin.getDynamicGradebook' },

    // Academic Years & Periods
    { method: 'GET',    path: '/admin/academic-years',                  handler: 'school-admin.getAllAcademicYears' },
    { method: 'POST',   path: '/admin/academic-years',                  handler: 'school-admin.createAcademicYear' },
    { method: 'PUT',    path: '/admin/academic-years/:id',              handler: 'school-admin.updateAcademicYear' },
    { method: 'DELETE', path: '/admin/academic-years/:id',              handler: 'school-admin.deleteAcademicYear' },

    { method: 'GET',    path: '/admin/academic-periods',                      handler: 'school-admin.getAcademicPeriods' },
    { method: 'POST',   path: '/admin/academic-periods',                      handler: 'school-admin.createAcademicPeriod' },
    { method: 'PUT',    path: '/admin/academic-periods/:id',                  handler: 'school-admin.updateAcademicPeriod' },
    { method: 'DELETE', path: '/admin/academic-periods/:id',                  handler: 'school-admin.deleteAcademicPeriod' },

    // ─── Certificates (auth:false + manual JWT — same pattern as attendance) ────
    { method: 'GET',    path: '/admin/certificates',              handler: 'school-admin.getAllCertificates',    config: { auth: false } },
    { method: 'POST',   path: '/admin/certificates',              handler: 'school-admin.createCertificate',    config: { auth: false } },
    { method: 'PUT',    path: '/admin/certificates/:id/revoke',   handler: 'school-admin.revokeCertificate',    config: { auth: false } },

    // Certificate types & mentions (public read — editable from Strapi panel)
    { method: 'GET',    path: '/admin/certificate-types',         handler: 'school-admin.getCertificateTypes',  config: { auth: false } },
    { method: 'GET',    path: '/admin/certificate-mentions',      handler: 'school-admin.getCertificateMentions', config: { auth: false } },

    // Student / Parent / Teacher: fetch their own certificates
    { method: 'GET',    path: '/my/certificates',                 handler: 'school-admin.getMyCertificates',    config: { auth: false } },
  ],
};

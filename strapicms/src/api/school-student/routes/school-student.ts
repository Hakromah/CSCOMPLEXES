/**
 * school-student router — mirrors /student/* from Spring Boot
 */

export default {
  routes: [
    { method: 'GET', path: '/student/profile',                            handler: 'school-student.getProfile' },
    { method: 'PUT', path: '/student/profile/update',                     handler: 'school-student.updateProfile' },
    { method: 'PUT', path: '/student/profile/change-password',            handler: 'school-student.changePassword' },

    { method: 'GET', path: '/student/classes',                            handler: 'school-student.getMyClasses' },
    { method: 'GET', path: '/student/attendance',                         handler: 'school-student.getMyAttendance' },
    { method: 'GET', path: '/student/timetables',                         handler: 'school-student.getMyTimetable' },
    { method: 'GET', path: '/student/exams',                              handler: 'school-student.getMyExams' },
    { method: 'GET', path: '/student/results',                            handler: 'school-student.getMyResults' },
    { method: 'GET', path: '/student/materials/:classId',                 handler: 'school-student.getMaterialsByClass' },
    { method: 'GET', path: '/student/academic/semester-transcript',       handler: 'school-student.getSemesterTranscript' },
    { method: 'GET', path: '/student/transcripts',                        handler: 'school-student.getStudentTranscriptsList' },
    { method: 'GET', path: '/student/transcripts/:id/preview',            handler: 'school-student.previewTranscript' },
    { method: 'GET', path: '/student/dashboard-stats',                    handler: 'school-student.getDashboardStats' },
  ],
};

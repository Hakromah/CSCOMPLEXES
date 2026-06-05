/**
 * school-teacher router — mirrors /teacher/* from Spring Boot
 */

export default {
  routes: [
    { method: 'GET',  path: '/teacher/classes',                              handler: 'school-teacher.getMyClasses' },
    { method: 'GET',  path: '/teacher/classes/:classId/students',            handler: 'school-teacher.getStudentsByClass' },
    { method: 'GET',  path: '/teacher/students',                             handler: 'school-teacher.getMyStudents' },

    { method: 'POST', path: '/teacher/attendance',                           handler: 'school-teacher.submitAttendance' },
    { method: 'PUT',  path: '/teacher/attendance/:attendanceId',             handler: 'school-teacher.updateAttendance' },
    { method: 'GET',  path: '/teacher/classes/:classId/attendance-history',  handler: 'school-teacher.getAttendanceHistory' },
    { method: 'GET',  path: '/teacher/classes/:classId/subjects',            handler: 'school-teacher.getSubjectsByClass' },

    { method: 'POST',   path: '/teacher/exams',                              handler: 'school-teacher.createExam' },
    { method: 'GET',    path: '/teacher/exams',                              handler: 'school-teacher.getMyExams' },
    { method: 'PUT',    path: '/teacher/exams/:id',                          handler: 'school-teacher.updateExam' },
    { method: 'DELETE', path: '/teacher/exams/:id',                          handler: 'school-teacher.deleteExam' },
    { method: 'PATCH',  path: '/teacher/exams/:id/toggle-status',            handler: 'school-teacher.toggleExamStatus' },

    { method: 'GET',  path: '/teacher/classes/:classId/gradebook',           handler: 'school-teacher.getGradebook' },
    { method: 'POST', path: '/teacher/results/bulk',                         handler: 'school-teacher.saveBulkResults' },
    { method: 'POST', path: '/teacher/results',                              handler: 'school-teacher.createResult' },
    { method: 'PUT',  path: '/teacher/results/:id',                          handler: 'school-teacher.updateResult' },
    { method: 'POST', path: '/teacher/results/submit',                       handler: 'school-teacher.submitResults' },
    { method: 'GET',  path: '/teacher/results',                              handler: 'school-teacher.getResults' },
    { method: 'GET',  path: '/teacher/results/filter',                       handler: 'school-teacher.filterResults' },
    { method: 'POST', path: '/teacher/marks',                                handler: 'school-teacher.submitMarks' },

    { method: 'GET',  path: '/teacher/timetables',                           handler: 'school-teacher.getMyTimetable' },
    { method: 'GET',  path: '/teacher/subjects',                             handler: 'school-teacher.getAllSubjects' },

    { method: 'PUT',  path: '/teacher/profile',                              handler: 'school-teacher.updateProfile' },
    { method: 'PUT',  path: '/teacher/change-password',                      handler: 'school-teacher.changePassword' },

    { method: 'GET',    path: '/teacher/materials',                          handler: 'school-teacher.getTeacherMaterials' },
    { method: 'GET',    path: '/teacher/materials/my-classes',               handler: 'school-teacher.getMyClassesForMaterials' },
    { method: 'POST',   path: '/teacher/materials/upload',                   handler: 'school-teacher.uploadTeacherMaterial' },
    { method: 'DELETE', path: '/teacher/materials/:id',                      handler: 'school-teacher.deleteTeacherMaterial' },
    { method: 'GET',    path: '/teacher/transcripts/student/:studentId',         handler: 'school-teacher.getStudentTranscriptsList' },
    { method: 'GET',    path: '/teacher/transcripts/:id/preview',            handler: 'school-teacher.previewTranscript' },
  ],
};

export default {
  routes: [
    // Profile
    { method: 'GET',   path: '/parent/profile',                         handler: 'school-parent.getProfile' },
    { method: 'PUT',   path: '/parent/profile',                         handler: 'school-parent.updateProfile' },
    { method: 'PUT',   path: '/parent/change-password',                 handler: 'school-parent.changePassword' },
    // Family
    { method: 'GET',   path: '/parent/family',                          handler: 'school-parent.getFamily' },
    // Children
    { method: 'GET',   path: '/parent/children',                        handler: 'school-parent.getChildren' },
    { method: 'GET',   path: '/parent/children/:id',                    handler: 'school-parent.getChildProfile' },
    { method: 'GET',   path: '/parent/children/:id/attendance',         handler: 'school-parent.getChildAttendance' },
    { method: 'GET',   path: '/parent/children/:id/results',            handler: 'school-parent.getChildResults' },
    { method: 'GET',   path: '/parent/children/:id/exams',              handler: 'school-parent.getChildExams' },
    { method: 'GET',   path: '/parent/children/:id/timetable',          handler: 'school-parent.getChildTimetable' },
    { method: 'GET',   path: '/parent/children/:id/materials',          handler: 'school-parent.getChildMaterials' },
    { method: 'GET',   path: '/parent/children/:id/transcripts',        handler: 'school-parent.getChildTranscripts' },
    { method: 'GET',   path: '/parent/children/:studentId/transcripts/:id/preview', handler: 'school-parent.previewChildTranscript' },
    // Finance
    { method: 'GET',   path: '/parent/finance',                         handler: 'school-parent.getFamilyFinance' },
    { method: 'GET',   path: '/parent/finance/:studentId',              handler: 'school-parent.getChildFinance' },
    { method: 'GET',   path: '/parent/finance/:studentId/invoices',     handler: 'school-parent.getChildInvoices' },
    { method: 'GET',   path: '/parent/finance/:studentId/payments',     handler: 'school-parent.getChildPayments' },
    // Calendar
    { method: 'GET',   path: '/parent/calendar',                        handler: 'school-parent.getCalendar' },
    // Dashboard
    { method: 'GET',   path: '/parent/dashboard',                       handler: 'school-parent.getDashboardStats' },
  ],
};

export default {
  routes: [
    { method: 'GET',    path: '/admin/behavior',                          handler: 'behavior-record.findAll' },
    { method: 'GET',    path: '/admin/behavior/:id',                      handler: 'behavior-record.findOne' },
    { method: 'POST',   path: '/admin/behavior',                          handler: 'behavior-record.create' },
    { method: 'PUT',    path: '/admin/behavior/:id',                      handler: 'behavior-record.update' },
    { method: 'DELETE', path: '/admin/behavior/:id',                      handler: 'behavior-record.remove' },
    { method: 'GET',    path: '/teacher/behavior/:studentId',             handler: 'behavior-record.getMyStudentsBehavior' },
    { method: 'POST',   path: '/teacher/behavior',                        handler: 'behavior-record.create' },
    { method: 'GET',    path: '/parent/behavior/:studentId',              handler: 'behavior-record.getChildBehavior' },
  ],
};

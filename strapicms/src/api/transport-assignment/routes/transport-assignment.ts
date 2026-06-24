export default {
  routes: [
    { method: 'GET',    path: '/admin/transport',               handler: 'transport-assignment.findAll' },
    { method: 'GET',    path: '/admin/transport/:id',           handler: 'transport-assignment.findOne' },
    { method: 'POST',   path: '/admin/transport',               handler: 'transport-assignment.create' },
    { method: 'PUT',    path: '/admin/transport/:id',           handler: 'transport-assignment.update' },
    { method: 'DELETE', path: '/admin/transport/:id',           handler: 'transport-assignment.remove' },
    { method: 'GET',    path: '/driver/my-assignments',         handler: 'transport-assignment.getMyAssignments' },
    { method: 'GET',    path: '/student/my-transport',          handler: 'transport-assignment.getMyTransport' },
    { method: 'GET',    path: '/parent/transport/:studentId',   handler: 'transport-assignment.getChildTransport' },
  ],
};

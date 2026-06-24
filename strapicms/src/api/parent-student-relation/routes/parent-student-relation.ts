export default {
  routes: [
    { method: 'GET',    path: '/admin/parent-relations',        handler: 'parent-student-relation.findAll' },
    { method: 'GET',    path: '/admin/parent-relations/:id',    handler: 'parent-student-relation.findOne' },
    { method: 'POST',   path: '/admin/parent-relations',        handler: 'parent-student-relation.create' },
    { method: 'PUT',    path: '/admin/parent-relations/:id',    handler: 'parent-student-relation.update' },
    { method: 'DELETE', path: '/admin/parent-relations/:id',    handler: 'parent-student-relation.remove' },
    { method: 'GET',    path: '/parent/my-children-relations',  handler: 'parent-student-relation.findByParent' },
  ],
};

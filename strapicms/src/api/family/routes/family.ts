export default {
  routes: [
    { method: 'GET',    path: '/admin/families',                          handler: 'family.findAll' },
    { method: 'GET',    path: '/admin/families/:id',                      handler: 'family.findOne' },
    { method: 'POST',   path: '/admin/families',                          handler: 'family.create' },
    { method: 'PUT',    path: '/admin/families/:id',                      handler: 'family.update' },
    { method: 'DELETE', path: '/admin/families/:id',                      handler: 'family.remove' },
    { method: 'POST',   path: '/admin/families/:id/parents',              handler: 'family.addParent' },
    { method: 'DELETE', path: '/admin/families/:id/parents/:userId',      handler: 'family.removeParent' },
    { method: 'POST',   path: '/admin/families/:id/students',             handler: 'family.addStudent' },
    { method: 'DELETE', path: '/admin/families/:id/students/:userId',     handler: 'family.removeStudent' },
    { method: 'GET',    path: '/parent/my-family',                        handler: 'family.getMyFamily' },
  ],
};

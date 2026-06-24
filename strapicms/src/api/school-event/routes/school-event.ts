export default {
  routes: [
    { method: 'GET',    path: '/admin/events',       handler: 'school-event.findAll' },
    { method: 'GET',    path: '/admin/events/:id',   handler: 'school-event.findOne' },
    { method: 'POST',   path: '/admin/events',       handler: 'school-event.create' },
    { method: 'PUT',    path: '/admin/events/:id',   handler: 'school-event.update' },
    { method: 'DELETE', path: '/admin/events/:id',   handler: 'school-event.remove' },
    { method: 'GET',    path: '/calendar/events',    handler: 'school-event.findPublished' },
  ],
};

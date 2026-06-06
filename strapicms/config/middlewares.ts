import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://2cscomplexes.com',
        'https://www.2cscomplexes.com',
        'https://api.2cscomplexes.com',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://192.168.1.137:3001',
        'https://amfofana.vercel.app'
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::cookie-to-bearer',
  'global::auth-cookie',
];

export default config;

import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1338),
  proxy: true, // <--- CRITICAL: Tells Strapi it is behind Nginx HTTPS proxy
  app: {
    keys: env.array('APP_KEYS'),
  },
  transfer: {
    remote: {
      enabled: true,
    },
  },
});

export default config;

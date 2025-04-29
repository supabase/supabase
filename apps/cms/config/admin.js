module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  serveAdminPanel: true,
  config: {
    locales: ['en'],
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    admin: {
      auth: {
        secret: env('ADMIN_JWT_SECRET'),
      },
    },
  },
  security: {
    csp: {
      enabled: false,
      policy: {
        'default-src': ["'self'"],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'https://market-assets.strapi.io',
          'https://koovxkbhviltdcwwaqvc.supabase.co',
          'https://*.supabase.co',
          'https://*.supabase.in',
        ],
        'media-src': [
          "'self'",
          'data:',
          'blob:',
          'https://market-assets.strapi.io',
          'https://koovxkbhviltdcwwaqvc.supabase.co',
          'https://*.supabase.co',
          'https://*.supabase.in',
        ],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'connect-src': ["'self'", 'https:', 'http:'],
      },
    },
  },
})

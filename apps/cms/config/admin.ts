export default ({ env }) => ({
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
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
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
      url: env('PUBLIC_URL', 'http://localhost:1337'),
      serveAdminPanel: true,
      watchIgnoreFiles: ['**/config/sync/**'],
    },
  },
  security: {
    csp: {
      enabled: false,
    },
  },
})

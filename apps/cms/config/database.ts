export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres')

  return {
    connection: {
      client,
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3302),
        database: env('DATABASE_NAME', 'postgres'),
        user: env('DATABASE_USER', 'postgres'),
        password: env('DATABASE_PASSWORD', 'postgres'),
        schema: env('DATABASE_SCHEMA', 'public'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
        },
      },
      pool: {
        min: 0,
        max: 3,
        acquireTimeoutMillis: 300000,
        createTimeoutMillis: 300000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
      },
      debug: true,
      acquireConnectionTimeout: 300000,
    },
  }
}

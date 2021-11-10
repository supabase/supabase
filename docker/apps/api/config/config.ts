import envSchema from 'env-schema'

/**
 * JSON Schema for required environment variables
 */
export const ENV_SCHEMA = {
  type: 'object',
  required: ['HOST', 'PORT', 'SUPABASE_URL', 'SUPABASE_KEY_ANON', 'SUPABASE_KEY_ADMIN'],
  properties: {
    HOST: { type: 'string' },
    PORT: { type: 'string' },
    SUPABASE_URL: { type: 'string' },
    SUPABASE_KEY_ANON: { type: 'string' },
    SUPABASE_KEY_ADMIN: { type: 'string' },
  },
}

/**
 * Load environment variables from .env file in development mode
 */
export const ENV_CONFIG = {
  schema: ENV_SCHEMA,
  dotenv: process.env.NODE_ENV == 'production' ? false : true,
}

/**
 * config can be used in any file
 */
export const config = envSchema(ENV_CONFIG)

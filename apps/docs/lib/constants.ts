export const API_URL = (
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    : process.env.NEXT_PUBLIC_API_URL
)?.replace(/\/platform$/, '')
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/docs'
export const IS_DEV = process.env.NODE_ENV === 'development'
export const IS_PLATFORM = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
export const IS_PRODUCTION = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
export const LOCAL_SUPABASE = process.env.NEXT_PUBLIC_LOCAL_SUPABASE === 'true'
export const MISC_URL = process.env.NEXT_PUBLIC_MISC_URL ?? ''
export const PROD_URL = `https://supabase.com${BASE_PATH}`

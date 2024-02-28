export const API_URL = (
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    : process.env.NEXT_PUBLIC_API_URL
).replace(/\/platform$/, '')
export const BUILD_STATIC_PREVIEW = process.env.BUILD_STATIC_PREVIEW === 'true'
export const IS_PLATFORM = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
export const LOCAL_SUPABASE = process.env.NEXT_PUBLIC_LOCAL_SUPABASE === 'true'

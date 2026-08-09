export const APP_NAME = 'Supabase'
export const DEFAULT_META_DESCRIPTION =
  'Build production-grade applications with a Postgres database, Authentication, instant APIs, Realtime, Functions, Storage and Vector embeddings. Start for free.'
export const IS_PROD = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
export const API_URL = process.env.NEXT_PUBLIC_API_URL!

// Products

export enum PRODUCT_NAMES {
  DATABASE = 'Database',
  AUTH = 'Authentication',
  STORAGE = 'Storage',
  FUNCTIONS = 'Edge Functions',
  REALTIME = 'Realtime',
  VECTOR = 'Vector',
}

export enum PRODUCT_SHORTNAMES {
  DATABASE = 'database',
  AUTH = 'auth',
  STORAGE = 'storage',
  FUNCTIONS = 'functions',
  REALTIME = 'realtime',
  VECTOR = 'vector',
}

export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://supabase.com'
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
      : 'http://localhost:3000'

export const LW_URL = `${SITE_ORIGIN}/launch-week`

export const LW12_DATE = 'August 12-16 / 7am PT'
export const LW12_TITLE = 'Launch Week 12'
export const LW13_DATE = '2 — 6 December / 7am PT'
export const LW13_TITLE = 'Launch Week 13'
export const TWEET_TEXT =
  'Launch Week 13 is just around the corner at @supabase. \nClaim your ticket and stay tuned for all the announcements! \n#launchweek'
export const TWEET_TEXT_PLATINUM = `Just conquered a platinum @supabase Launch Week 13 ticket. Share twice to get one! \n#launchweek`
export const TWEET_TEXT_SECRET = `Found the secret golden ticket for @supabase's Launch Week 13. \nCan you find it? \n#launchweek`

export const LW14_DATE = '31 March — 4 April / 7am PT'
export const LW14_TITLE = 'Launch Week 14'
export const LW14_URL = `${SITE_ORIGIN}/launch-week`

export const LW15_DATE = '14 — 18 Jul / 8am PT'
export const LW15_TITLE = 'Launch Week 15'
export const LW15_TWEET_TEXT =
  'Launch Week 15 is just around the corner at @supabase. \nClaim your ticket and stay tuned for all the announcements! \n#launchweek'
export const LW15_URL = `${SITE_ORIGIN}/launch-week`

export const SITE_NAME = 'Supabase'

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

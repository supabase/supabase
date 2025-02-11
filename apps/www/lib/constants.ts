export const APP_NAME = 'Supabase'
export const DEFAULT_META_DESCRIPTION =
  'Build production-grade applications with a Postgres database, Authentication, instant APIs, Realtime, Functions, Storage and Vector embeddings. Start for free.'
export const IS_PROD = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
export const API_URL = process.env.NEXT_PUBLIC_API_URL

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

// Launch Weeek
export const SAMPLE_TICKET_NUMBER = 1234
export const SITE_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://supabase.com/launch-week'
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/launch-week`
      : 'http://localhost:3000/launch-week'
export const LW_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://supabase.com/launch-week'
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/launch-week`
      : 'http://localhost:3000/launch-week'
export const SITE_ORIGIN = new URL(SITE_URL).origin
export const TWITTER_USER_NAME = 'supabase'
export const LW7_DATE = 'April 10th 2023'
export const LW8_DATE = 'August 7-11'
export const LW8_LAUNCH_DATE = '2023-08-07T09:00:00.000-07:00'
export const LWX_DATE = 'Dec 11-15 / 8am PT'
export const LWX_LAUNCH_DATE = '2023-12-11T08:00:00.000-07:00'
export const LW11_DATE = 'April 15-19 / 7am PT'
export const LW11_LAUNCH_DATE = '2024-04-15T07:00:00.000-07:00'
export const LW11_LAUNCH_DATE_END = '2024-04-21T23:59:59.000-07:00'
export const LW12_DATE = 'August 12-16 / 7am PT'
export const LW12_LAUNCH_DATE = '2024-08-12T07:00:00.000-07:00'
export const LW12_LAUNCH_DATE_END = '2024-08-18T23:59:59.000-07:00'
export const LW12_TITLE = 'Launch Week 12'
export const LW13_DATE = '2 — 6 December / 7am PT'
export const LW13_LAUNCH_DATE = '2024-12-02T07:00:00.000-07:00'
export const LW13_LAUNCH_DATE_END = '2024-12-16T23:59:59.000-07:00'
export const LW13_TITLE = 'Launch Week 13'
export const TWEET_TEXT =
  'Launch Week 13 is just around the corner at @supabase. \nClaim your ticket and stay tuned for all the announcements! \n#launchweek'
export const TWEET_TEXT_PLATINUM = `Just conquered a platinum @supabase Launch Week 13 ticket. Share twice to get one! \n#launchweek`
export const TWEET_TEXT_SECRET = `Found the secret golden ticket for @supabase's Launch Week 13. \nCan you find it? \n#launchweek`
export const SITE_NAME = 'Supabase'

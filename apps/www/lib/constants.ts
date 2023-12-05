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
export const SITE_ORIGIN = new URL(SITE_URL).origin
export const TWITTER_USER_NAME = 'supabase'
export const LW7_DATE = 'April 10th 2023'
export const LW8_DATE = 'August 7-11'
export const LW8_LAUNCH_DATE = '2023-08-07T09:00:00.000-07:00'
export const LWX_DATE = 'Dec 11-15 / 8am PT'
export const LWX_LAUNCH_DATE = '2023-12-11T08:00:00.000-08:00'
export const TWEET_TEXT =
  '#SupaLaunchWeek 🆇 is coming December 11-15 🚀\n\nClaim your ticket for a chance to win @supabase swag:\n'
export const TWEET_TEXT_GOLDEN = `I turned my #SupaLaunchWeek 🆇 ticket Platinum! 🩶😎\n\nClaim your own ticket to win @supabase swag:\n`
export const TWEET_TEXT_SECRET = `I found a secret #SupaLaunchWeek 🆇 ticket! \n\nGuess the word at supabase.com/launch-week to get yours:\n`
export const SITE_NAME = 'Supabase'

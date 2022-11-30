export const APP_NAME = 'Supabase'
export const DESCRIPTION = 'The Open Source Alternative to Firebase.'

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
export const COOKIE = 'supa-launch-week-ticke-user-id'
export const DATE = 'December 12th, 2022'
export const TWEET_TEXT = 'Got my ticket for #SupaLaunchWeek 6!'
export const TWEET_TEXT_GOLDEN = `Woop! I got a Golden Ticket for #SupaLaunchWeek 6! SupaSwag on its way!`
export const SITE_NAME = 'Supabase'

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
export const DATE = 'April 3rd 2023'
export const TWEET_TEXT =
  'It’s almost #SupaLaunchWeek 7! Generate your unique ticket here 👇 you can also win a mechanical keyboard 🤩'
export const TWEET_TEXT_GOLDEN = `I turned my #SupaLaunchWeek 7 ticket Gold! Thrice the chance to win a mechanical keyboard 🤩 `
export const SITE_NAME = 'Supabase'

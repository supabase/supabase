export const LW_SITE_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://supabase.com/ga-week'
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/ga-week`
      : 'http://localhost:3000/ga-week'

export const LW8_END_DATE = '2023-08-11T23:59:59.999-07:00'

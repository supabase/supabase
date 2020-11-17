if (!process.env.SUPABASE_URL) {
  console.log('constants.ts', 'Make sure you have a `.env` file to populate your variables.')
}

export const SUPABASE_URL = process.env.SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''

export const Styles = {
  fontNormal: 20,
  fontMedium: 28,
  fontLarge: 34,
  fontExtraLarge: 40,
  colorPrimary: 'black',
  spacing: 12,
}

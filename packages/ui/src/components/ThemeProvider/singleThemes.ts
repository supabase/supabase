export interface SingleTheme {
  name: string
  value: string
}

export const singleThemes = [
  { name: 'Dark', value: 'dark' }, // Classic Supabase dark
  { name: 'Light', value: 'light' }, // Classic Supabase light
  { name: 'Classic Dark', value: 'classic-dark' }, // Deep Dark Supabase dark
  { name: 'System', value: 'system' }, // Classic Supabase light
]

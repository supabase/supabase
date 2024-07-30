export interface Theme {
  name: string
  value: string
}

export const themes = [
  { name: 'System', value: 'system' }, // Switches between dark and light
  { name: 'Dark', value: 'dark' }, // Classic Supabase dark
  { name: 'Classic Dark', value: 'classic-dark' }, // Deep Dark Supabase dark
  { name: 'Light', value: 'light' }, // Classic Supabase light
]

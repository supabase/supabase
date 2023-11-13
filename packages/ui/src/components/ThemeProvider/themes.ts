export interface Theme {
  name: string
  value: string
}

export const themes = [
  { name: 'System', value: 'system' }, // Switches between dark and light
  { name: 'Dark', value: 'dark' }, // Classic Supabase dark
  { name: 'Deep Dark', value: 'deep-dark' }, // High contrast dark introduced in Dec. 2023
  { name: 'Light', value: 'light' }, // Classic Supabase light
]

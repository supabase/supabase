export interface ThemePrefix {
  name: string
  value: string
  supports?: 'dark' | 'light'[]
}

export const prefixedThemes = [
  { name: 'Deep dark', value: 'deep', supports: ['dark'] }, // Deep Dark Supabase dark
]

export const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const HIDDEN_PLACEHOLDER = '**** **** **** ****'
export const COLORS = [
  'brand',
  'scale',
  'tomato',
  'red',
  'crimson',
  'pink',
  'purple',
  'violet',
  'indigo',
  'blue',
  'green',
  'grass',
  'orange',
  'sky',
  'yellow',
  'amber',
  'gold',
  'gray',
  'slate',
]
export type AvailableColors =
  | 'brand'
  | 'brandAlt'
  | 'scale'
  | 'tomato'
  | 'red'
  | 'crimson'
  | 'pink'
  | 'purple'
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'green'
  | 'grass'
  | 'orange'
  | 'sky'
  | 'yellow'
  | 'amber'
  | 'gold'
  | 'gray'
  | 'slate'

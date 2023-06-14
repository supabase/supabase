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
] as const;

export type AvailableColors = (typeof COLORS)[number]

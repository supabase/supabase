/**
 * Separate from `Usage.constants` so modules that only need a color token don't
 * import the category tree — a cycle for anything `Usage.constants` renders.
 */
export const COLOR_MAP = {
  white: { bar: 'fill-foreground', marker: 'bg-foreground' },
  green: { bar: 'fill-green-800', marker: 'bg-green-800' },
  'dark-green': { bar: 'fill-green-1000', marker: 'bg-green-1000' },
  blue: { bar: 'fill-blue-900', marker: 'bg-blue-900' },
  yellow: { bar: 'fill-yellow-800', marker: 'bg-yellow-800' },
  'dark-yellow': { bar: 'fill-yellow-1000', marker: 'bg-yellow-1000' },
  orange: { bar: 'fill-orange-800', marker: 'bg-orange-800' },
  'dark-orange': { bar: 'fill-orange-1000', marker: 'bg-orange-1100' },
  teal: { bar: 'fill-teal-600', marker: 'bg-teal-700' },
  red: { bar: 'fill-red-800', marker: 'bg-red-800' },
  'dark-red': { bar: 'fill-red-1000', marker: 'bg-red-1000' },
  purple: { bar: 'fill-purple-900', marker: 'bg-purple-900' },
}

export type AttributeColor = keyof typeof COLOR_MAP

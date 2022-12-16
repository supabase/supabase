// Just extracting the color configuration to a single file so that it's easier to observe
// Needs better naming to be honest, but just to get things going

// For ChartHandler
export const CHART_COLORS = {
  TICK: 'var(--colors-scale6)',
  AXIS: 'var(--colors-scale6)',
  GREEN_1: 'var(--colors-brand9)', // #3ECF8E
  GREEN_2: 'var(--colors-brand6)',
}

// refer to packages/ui/radix-colors.js for full list of colors
export const STACK_COLORS = [
  ['brand', 9],
  ['mint', 9],
  ['blue', 9],
  ['sky', 9],
  ['lime', 9],
  ['yellow', 9],
  ['orange', 9],
].map(([color, n]) => ({
  lighter: `var(--colors-${color}${(n as number) - 1})`,
  base: `var(--colors-${color}${n})`,
  darker: `var(--colors-${color}${(n as number) + 1})`,
}))

export const USAGE_COLORS = {
  200: 'var(--colors-brand9)',
  201: 'var(--colors-brand8)',
  400: 'var(--colors-amber9)',
  401: 'var(--colors-amber8)',
  404: 'var(--colors-amber7)',
  500: 'var(--colors-red9)',
}

export enum DateTimeFormats {
  FULL = 'MMM D, YYYY, hh:mma',
  DATE_ONLY = 'MMM D, YYYY',
}

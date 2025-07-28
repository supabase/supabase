// Just extracting the color configuration to a single file so that it's easier to observe
// Needs better naming to be honest, but just to get things going

// For ChartHandler
export const CHART_COLORS = {
  TICK: 'hsl(var(--background-overlay-hover))',
  AXIS: 'hsl(var(--background-overlay-hover))',
  GREEN_1: 'hsl(var(--brand-default))', // #3ECF8E
  GREEN_2: 'hsl(var(--brand-500))',
  RED_1: 'hsl(var(--destructive-default))',
  RED_2: 'hsl(var(--destructive-500))',
  REFERENCE_LINE: 'hsl(var(--foreground-muted))',
  REFERENCE_LINE_TEXT: 'hsl(var(--foreground-muted))',
}

const LIGHT_STACKED_CHART_COLORS = [
  '#3ECF8E',
  '#097c4f',
  '#DA760B',
  '#EDC35E',
  '#65BCD9',
  '#0063E8',
  '#DB8DF9',
  '#B616A6',
]

const DARK_STACKED_CHART_COLORS = [
  '#3ECF8E',
  '#A3FFC2',
  '#DA760B',
  '#EDD35E',
  '#65BCD9',
  '#0063E8',
  '#DB8DF9',
  '#B616A6',
]

// Default to light mode colors, will be updated based on theme
export let STACKED_CHART_COLORS = LIGHT_STACKED_CHART_COLORS

// Function to update colors based on theme
export const updateStackedChartColors = (isDarkMode: boolean) => {
  STACKED_CHART_COLORS = isDarkMode ? DARK_STACKED_CHART_COLORS : LIGHT_STACKED_CHART_COLORS
}

// refer to packages/ui/radix-colors.js for full list of colors
export type ValidStackColor =
  | 'brand'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'slate'
  | 'indigo'
  | 'tomato'
  | 'orange'
  | 'amber'

export const genStackColorScales = (colors: ValidStackColor[]) =>
  colors.map((color) => {
    // override default base scale for certain colors that do not have good contrast
    const scale =
      (
        {
          slate: 11,
        } as any
      )[color] ?? 9
    return {
      lighter: `var(--colors-${color}${(scale as number) - 1})`,
      base: `var(--colors-${color}${scale})`,
      darker: `var(--colors-${color}${(scale as number) + 1})`,
    }
  })

export const DEFAULT_STACK_COLORS: ValidStackColor[] = [
  'brand',
  'slate',
  'blue',
  'yellow',
  'indigo',
]

export enum DateTimeFormats {
  FULL = 'MMM D, YYYY, hh:mma',
  FULL_SECONDS = 'MMM D, hh:mm:ssa',
  DATE_ONLY = 'MMM D, YYYY',
}

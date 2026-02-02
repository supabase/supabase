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
  '#DA760B',
  '#097c4f',
  '#EDC35E',
  '#65BCD9',
  '#0063E8',
  '#DB8DF9',
  '#B616A6',
]

const LIGHT_STACKED_CHART_FILLS = [
  '#9FE8C7',
  '#FFB885',
  '#4BA67A',
  '#F6D99F',
  '#B2DCEC',
  '#80B1F4',
  '#EDC9FC',
  '#DB8BD3',
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

const DARK_STACKED_CHART_FILLS = [
  '#2A5C3F',
  '#1F3D2A',
  '#5C3D0A',
  '#5C5230',
  '#2A3D45',
  '#001F3D',
  '#4A3D5C',
  '#3D1F3A',
]

// Default to light mode colors, will be updated based on theme
export let STACKED_CHART_COLORS = LIGHT_STACKED_CHART_COLORS
export let STACKED_CHART_FILLS = LIGHT_STACKED_CHART_FILLS
// Function to update colors based on theme
export const updateStackedChartColors = (isDarkMode: boolean) => {
  STACKED_CHART_COLORS = isDarkMode ? DARK_STACKED_CHART_COLORS : LIGHT_STACKED_CHART_COLORS
  STACKED_CHART_FILLS = isDarkMode ? DARK_STACKED_CHART_FILLS : LIGHT_STACKED_CHART_FILLS
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

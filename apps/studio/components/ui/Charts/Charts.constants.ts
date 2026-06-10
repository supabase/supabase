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

/**
 * Semantic chart colour roles — the single source of truth for what a colour *means*
 * in the database observability report. Colour encodes meaning, not series position,
 * so the same concept reads the same across every chart (FE-3578).
 *
 *  used      primary consumed quantity        green   (brand)
 *  overhead  consumed, secondary              violet
 *  headroom  free / idle / unused             grey    (recedes)
 *  limit     a ceiling, not a value           grey    (rendered as a dashed line)
 *  in        directional flow in / read       blue
 *  out       directional flow out / write     amber
 *  alert     a value breaching its limit       red     (reserved — wire up later)
 *
 * Each role carries a `color` (the solid line/bar) and a `fill` (the translucent
 * area / focus-dot tint). Dark-mode shades are tuned lighter/more saturated so they
 * read on the dark canvas, mirroring how the existing CPU series were authored.
 */
export type ChartColorRole = {
  color: { light: string; dark: string }
  fill: { light: string; dark: string }
}

export const CHART_ROLE_COLORS = {
  used: {
    color: { light: '#3ECF8E', dark: '#3ECF8E' },
    fill: { light: '#9FE8C7', dark: '#2A5C3F' },
  },
  overhead: {
    color: { light: '#7C3AED', dark: '#9F7AEA' },
    fill: { light: '#DDD6FE', dark: '#3C2E63' },
  },
  headroom: {
    color: { light: '#C4C7CB', dark: '#3A3D41' },
    fill: { light: '#DBDCDF', dark: '#303336' },
  },
  limit: {
    color: { light: '#8B94A3', dark: '#9CA3B0' },
    fill: { light: '#D5D9DF', dark: '#444A54' },
  },
  in: {
    color: { light: '#2563EB', dark: '#60A5FA' },
    fill: { light: '#BFDBFE', dark: '#1E3A5F' },
  },
  out: {
    color: { light: '#F59E0B', dark: '#FBBF24' },
    fill: { light: '#FDE68A', dark: '#5C4218' },
  },
  alert: {
    color: { light: '#EF4444', dark: '#F87171' },
    fill: { light: '#FECACA', dark: '#5C2A2A' },
  },
} as const satisfies Record<string, ChartColorRole>

export const CHART_OVERHEAD_RAMP: ChartColorRole[] = [
  CHART_ROLE_COLORS.overhead,
  {
    color: { light: '#F59E0B', dark: '#FBBF24' },
    fill: { light: '#FDE68A', dark: '#5C4218' },
  },
  {
    color: { light: '#14B8A6', dark: '#2DD4BF' },
    fill: { light: '#99F6E4', dark: '#134E4A' },
  },
  {
    color: { light: '#EC4899', dark: '#F472B6' },
    fill: { light: '#FBCFE8', dark: '#5C2A47' },
  },
  {
    color: { light: '#3B82F6', dark: '#60A5FA' },
    fill: { light: '#BFDBFE', dark: '#1E3A5F' },
  },
]

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
    let scale = 9
    if (color === 'slate') {
      scale = 11
    }
    return {
      lighter: `var(--color-${color}-${scale - 1}00)`,
      base: `var(--color-${color}-${scale * 100})`,
      darker: `var(--color-${color}-${scale + 1}00)`,
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

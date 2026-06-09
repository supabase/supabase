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
    color: { light: '#A78BFA', dark: '#C4B5FD' },
    fill: { light: '#DDD6FE', dark: '#4C3F6B' },
  },
  headroom: {
    color: { light: '#4A525E', dark: '#5E6573' },
    fill: { light: '#C7CBD2', dark: '#3A3F49' },
  },
  limit: {
    color: { light: '#8B94A3', dark: '#9CA3B0' },
    fill: { light: '#D5D9DF', dark: '#444A54' },
  },
  in: {
    color: { light: '#4F9CF9', dark: '#6BB0FF' },
    fill: { light: '#B9D6FD', dark: '#1E3A5F' },
  },
  out: {
    color: { light: '#F2B05E', dark: '#F5BE7A' },
    fill: { light: '#FBE0BD', dark: '#5C4424' },
  },
  alert: {
    color: { light: '#F87171', dark: '#FB8C8C' },
    fill: { light: '#FECACA', dark: '#5C2A2A' },
  },
} as const satisfies Record<string, ChartColorRole>

/**
 * Ordered "overhead" ramp for charts that break a consumed quantity into several
 * secondary categories (CPU busy states, disk-usage buckets, connection pools).
 * Step 0 is the `overhead` role so the ramp stays anchored to the role palette;
 * later steps stay distinct from one another and from the primary roles.
 *
 *   0 violet (= overhead)   1 amber   2 pink   3 teal   4 indigo
 */
export const CHART_OVERHEAD_RAMP: ChartColorRole[] = [
  CHART_ROLE_COLORS.overhead,
  {
    color: { light: '#F2B05E', dark: '#F5BE7A' },
    fill: { light: '#FBE0BD', dark: '#5C4424' },
  },
  {
    color: { light: '#F472B6', dark: '#F9A8D4' },
    fill: { light: '#FBCFE8', dark: '#5C2A47' },
  },
  {
    color: { light: '#2DD4BF', dark: '#5EEAD4' },
    fill: { light: '#99F6E4', dark: '#134E4A' },
  },
  {
    color: { light: '#818CF8', dark: '#A5B4FC' },
    fill: { light: '#C7D2FE', dark: '#312E5C' },
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

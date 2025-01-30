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
}

// export const STACKED_CHART_COLORS = [
//   '#3ECF8E',
//   '#6929c4',
//   '#39A878',
//   '#1192e8',
//   '#9f1853',
//   '#fa4d56',
//   '#198038',
//   '#570408',
//   '#8FE4BE',
//   '#ee538b',
//   '#b28600',
//   '#009d9a',
//   '#AAEACD',
//   '#8a3800',
//   '#a56eff',
// ]
export const STACKED_CHART_COLORS = [
  '#3ECF8E',
  '#AAEACD',
  '#28604A',
  '#8FE4BE',
  '#1D3F32',
  '#C5F1DD',
  '#318362',
  '#74DDAE',
  '#39A878',
  '#E0F8ED',
  '#59D69E',
]

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
  FULL_SECONDS = 'MMM D, YYYY, hh:mm:ssa',
  DATE_ONLY = 'MMM D, YYYY',
}

// Just extracting the color configuration to a single file so that it's easier to observe
// Needs better naming to be honest, but just to get things going

// For ChartHandler
export const CHART_COLORS = {
  TICK: 'var(--colors-scale6)',
  AXIS: 'var(--colors-scale6)',
  GREEN_1: 'hsl(var(--brand-default))', // #3ECF8E
  GREEN_2: 'hsl(var(--brand-500))',
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

export const DEFAULT_STACK_COLORS : ValidStackColor[] = ['brand', 'slate', 'blue', 'yellow', 'indigo']

export enum DateTimeFormats {
  FULL = 'MMM D, YYYY, hh:mma',
  DATE_ONLY = 'MMM D, YYYY',
}

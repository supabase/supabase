import { COUNTRIES } from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/BillingAddress.constants'
import { COUNTRY_LAT_LON } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'

export type CountryCountRow = { country: string | null; count: number | string }

export interface MapChartTheme {
  zeroFill: string // the background color of the map when there are no requests
  scale: [string, string, string, string, string] // low -> high
  boundaryStroke: string
  boundaryStrokeHover: string
  markerFill: string
  oceanFill: string
}

export const MAP_CHART_THEME: { light: MapChartTheme; dark: MapChartTheme } = {
  light: {
    zeroFill: 'hsl(var(--background-surface-400))',
    scale: [
      'hsl(var(--brand-200))',
      'hsl(var(--brand-300))',
      'hsl(var(--brand-400))',
      'hsl(var(--brand-500))',
      'hsl(var(--brand-600))',
    ],
    boundaryStroke: 'hsla(var(--brand-300), 0.6)',
    boundaryStrokeHover: 'hsl(var(--brand-500))',
    markerFill: 'hsl(var(--brand-500))',
    oceanFill: 'transparent',
  },
  dark: {
    zeroFill: 'hsl(var(--background-selection))',
    scale: [
      'hsl(var(--brand-200))',
      'hsl(var(--brand-300))',
      'hsl(var(--brand-400))',
      'hsl(var(--brand-500))',
      'hsl(var(--brand-600))',
    ],
    boundaryStroke: 'hsla(var(--brand-300), 0.6)',
    boundaryStrokeHover: 'hsl(var(--brand-500))',
    markerFill: 'hsl(var(--brand-500))',
    oceanFill: 'transparent',
  },
}

export const buildCountsByIso2 = (rows: CountryCountRow[]): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    if (!row.country) continue
    const code = row.country.toUpperCase()
    const numeric = typeof row.count === 'number' ? row.count : Number(row.count)
    if (!Number.isFinite(numeric)) continue
    counts[code] = (counts[code] || 0) + numeric
  }
  return counts
}

export const getFillColor = (
  value: number,
  max: number,
  theme: MapChartTheme = MAP_CHART_THEME.dark
): string => {
  if (max <= 0 || !value) return theme.zeroFill
  const ratio = value / max
  if (ratio > 0.8) return theme.scale[4]
  if (ratio > 0.6) return theme.scale[3]
  if (ratio > 0.4) return theme.scale[2]
  if (ratio > 0.2) return theme.scale[1]
  return theme.scale[0]
}

const MICRO_COUNTRIES = new Set([
  'Singapore',
  'Monaco',
  'Andorra',
  'Liechtenstein',
  'San Marino',
  'Vatican',
  'Vatican City',
  'Luxembourg',
  'Malta',
  'Bahrain',
  'Brunei',
  'Qatar',
  'Kuwait',
  'Hong Kong',
  'Macau',
])

export const isMicroCountry = (name: string): boolean => MICRO_COUNTRIES.has(name)

export const isKnownCountryCode = (code: string): code is keyof typeof COUNTRY_LAT_LON => {
  return Object.prototype.hasOwnProperty.call(COUNTRY_LAT_LON, code)
}

export const computeMarkerRadius = (value: number, max: number): number => {
  if (max <= 0) return 2
  return Math.max(1.5, Math.min(4, (value / max) * 4))
}

export const extractIso2FromFeatureProps = (
  props: Record<string, unknown> | null | undefined
): string | undefined => {
  if (!props) return undefined
  const raw = (props['ISO_A2_EH'] ?? props['ISO_A2']) as unknown
  if (typeof raw !== 'string') return undefined
  const code = raw.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : undefined
}

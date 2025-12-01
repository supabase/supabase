import { COUNTRIES } from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/BillingAddress.constants'
import { COUNTRY_LAT_LON } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'

export type CountryCountRow = { country: string | null; count: number | string }

export interface MapChartTheme {
  zeroFill: string // fill for countries with zero (or when max=0)
  brandFill: string // base fill color (same for all, vary by opacity)
  opacityScale: [number, number, number, number, number] // low -> high opacities
  boundaryStroke: string
  boundaryStrokeHover: string
  markerFill: string
  oceanFill: string
}

export const MAP_CHART_THEME: { light: MapChartTheme; dark: MapChartTheme } = {
  light: {
    zeroFill: 'hsl(var(--background-surface-400))',
    brandFill: 'hsl(var(--brand-default))',
    opacityScale: [0.18, 0.32, 0.5, 0.68, 0.86],
    boundaryStroke: 'hsla(var(--brand-300), 0.6)',
    boundaryStrokeHover: 'hsl(var(--brand-500))',
    markerFill: 'hsl(var(--brand-default))',
    oceanFill: 'transparent',
  },
  dark: {
    zeroFill: 'hsl(var(--background-selection))',
    brandFill: 'hsl(var(--brand-default))',
    opacityScale: [0.18, 0.32, 0.5, 0.68, 0.86],
    boundaryStroke: 'hsla(var(--brand-300), 0.6)',
    boundaryStrokeHover: 'hsl(var(--brand-500))',
    markerFill: 'hsl(var(--brand-default))',
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
  return theme.brandFill
}

export const getFillOpacity = (
  value: number,
  max: number,
  theme: MapChartTheme = MAP_CHART_THEME.dark
): number => {
  if (max <= 0 || !value) return 1
  const ratio = value / max
  if (ratio > 0.8) return theme.opacityScale[4]
  if (ratio > 0.6) return theme.opacityScale[3]
  if (ratio > 0.4) return theme.opacityScale[2]
  if (ratio > 0.2) return theme.opacityScale[1]
  return theme.opacityScale[0]
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

// Best-effort extraction of ISO2 code from feature properties, with name fallback
export const extractIso2FromFeatureProps = (
  props?: Record<string, unknown>
): string | undefined => {
  if (!props) return undefined
  const candidates = [
    'ISO_A2_EH',
    'ISO_A2',
    'iso_a2',
    'ADMIN_ISO_A2',
    'WB_A2',
    'ADM0_A3_IS',
    'ADM0_A3',
    'ISO_N3',
    'id',
  ]
  for (const key of candidates) {
    const v = props[key] as unknown
    if (typeof v === 'string' && v.length === 2) return v.toUpperCase()
  }
  const name =
    (props['name'] as string | undefined) || (props['NAME'] as string | undefined) || undefined
  if (!name) return undefined
  const entry = COUNTRIES.find((c) => c.name === name)
  return entry?.code
}

export const iso2ToCountryName = (iso2: string): string => {
  const code = iso2.toUpperCase()
  const entry = COUNTRIES.find((c) => c.code === code)
  return entry?.name ?? code
}

import { Database, Info, Map as MapIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Badge, cn, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import { COUNTRY_LAT_LON } from '@/components/interfaces/ProjectCreation/ProjectCreation.constants'
import {
  extractIso2FromFeatureProps,
  iso2ToCountryName,
} from '@/components/interfaces/Reports/utils/geo'
import { BASE_PATH } from '@/lib/constants'

type GeographicUsageRange = '24h' | '7d' | '30d'

export type GeographicUsageCountry = {
  code: keyof typeof COUNTRY_LAT_LON
  requests: number
  change: number
  flag: string
}

const RANGE_OPTIONS: Record<GeographicUsageRange, { label: string; multiplier: number }> = {
  '24h': { label: 'Last 24 hours', multiplier: 1 },
  '7d': { label: 'Last 7 days', multiplier: 6.72 },
  '30d': { label: 'Last 30 days', multiplier: 27.8 },
}

// Presentation-only fixture for the guarded beta. The backend contract intentionally lives
// outside this UI PR and can replace this array without changing the map component.
const PREVIEW_COUNTRIES: GeographicUsageCountry[] = [
  { code: 'US', requests: 846_320, change: 12.4, flag: '🇺🇸' },
  { code: 'DE', requests: 381_740, change: 8.1, flag: '🇩🇪' },
  { code: 'GB', requests: 294_680, change: -3.2, flag: '🇬🇧' },
  { code: 'BR', requests: 236_410, change: 21.7, flag: '🇧🇷' },
  { code: 'IN', requests: 198_750, change: 5.6, flag: '🇮🇳' },
  { code: 'AU', requests: 134_260, change: 2.8, flag: '🇦🇺' },
  { code: 'JP', requests: 112_980, change: -1.9, flag: '🇯🇵' },
  { code: 'CA', requests: 98_440, change: 4.3, flag: '🇨🇦' },
  { code: 'SG', requests: 74_810, change: 18.2, flag: '🇸🇬' },
  { code: 'FR', requests: 62_130, change: -0.7, flag: '🇫🇷' },
]

const formatPercent = (value: number) => `${value.toFixed(1)}%`

export const getGeographicUsageMarkerRadius = (requests: number, maxRequests: number) => {
  if (maxRequests <= 0) return 5
  return 5 + Math.sqrt(requests / maxRequests) * 15
}

const BubbleLegend = ({ maxRequests }: { maxRequests: number }) => (
  <div className="flex h-11 items-center justify-center gap-3 border-t text-xs text-foreground-lighter">
    <span>Fewer requests</span>
    <div className="flex h-6 items-end gap-2" aria-hidden="true">
      {[6, 9, 12, 16].map((size) => (
        <span
          key={size}
          className="rounded-full border border-brand-600 bg-brand-400/25"
          style={{ width: size, height: size }}
        />
      ))}
    </div>
    <span>{maxRequests.toLocaleString()}+</span>
  </div>
)

const GeographicRequestMap = ({
  countries,
  selectedCode,
  onSelect,
}: {
  countries: GeographicUsageCountry[]
  selectedCode?: GeographicUsageCountry['code']
  onSelect: (code: GeographicUsageCountry['code']) => void
}) => {
  const worldMapUrl = `${BASE_PATH}/json/worldmap.json`
  const maxRequests = Math.max(...countries.map((country) => country.requests), 0)
  const countriesByCode = useMemo(
    () => Object.fromEntries(countries.map((country) => [country.code, country])),
    [countries]
  )

  return (
    <div className="min-w-0 border-r lg:border-r max-lg:border-b">
      <div className="relative h-[420px] overflow-hidden bg-surface-100 [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--border-default))_1px,transparent_0)] [background-size:20px_20px]">
        <div className="absolute left-4 top-4 z-10 flex h-7 items-center gap-2 rounded-full border bg-surface-100/95 px-3 text-xs text-foreground-light shadow-sm backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_0_3px_hsl(var(--brand-400)/0.18)]" />
          Request volume
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 155 }}
          className="h-full w-full"
          aria-label="World map of database requests by country"
        >
          <ZoomableGroup minZoom={1} maxZoom={5} zoom={1.3} center={[6, 22]}>
            <Geographies geography={worldMapUrl}>
              {({ geographies }) =>
                geographies.map((geography) => {
                  const code = extractIso2FromFeatureProps(
                    geography.properties as Record<string, unknown> | undefined
                  )
                  const country = code ? countriesByCode[code] : undefined
                  const name =
                    (geography.properties?.name as string | undefined) ??
                    (geography.properties?.NAME as string | undefined) ??
                    'Unknown'

                  return (
                    <Geography
                      key={geography.rsmKey}
                      geography={geography}
                      aria-label={
                        country
                          ? `${iso2ToCountryName(country.code)}: ${country.requests.toLocaleString()} requests`
                          : `${name}: no eligible data`
                      }
                      style={{
                        default: {
                          fill: 'var(--background-surface-300)',
                          stroke: 'hsl(var(--border-default))',
                          strokeWidth: 0.55,
                          outline: 'none',
                        },
                        hover: {
                          fill: 'var(--background-surface-400)',
                          stroke: 'hsl(var(--border-strong))',
                          strokeWidth: 0.65,
                          outline: 'none',
                        },
                        pressed: {
                          fill: 'var(--background-surface-400)',
                          outline: 'none',
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {countries.map((country) => {
              const coordinates = COUNTRY_LAT_LON[country.code]
              const radius = getGeographicUsageMarkerRadius(country.requests, maxRequests)
              const isSelected = selectedCode === country.code
              const name = iso2ToCountryName(country.code)

              return (
                <Marker
                  key={country.code}
                  coordinates={[coordinates.lon, coordinates.lat]}
                  role="button"
                  tabIndex={0}
                  aria-label={`${name}: ${country.requests.toLocaleString()} requests`}
                  onClick={() => onSelect(country.code)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(country.code)
                    }
                  }}
                  className="cursor-pointer outline-none focus-visible:[&_circle:first-child]:stroke-foreground"
                >
                  {isSelected && (
                    <circle
                      r={radius + 4}
                      fill="none"
                      stroke="hsl(var(--brand-default))"
                      strokeWidth={1.5}
                      opacity={0.35}
                    />
                  )}
                  <circle
                    r={radius}
                    fill="hsl(var(--brand-default) / 0.24)"
                    stroke="hsl(var(--brand-600))"
                    strokeWidth={1.3}
                  />
                  <circle
                    r={2.5}
                    fill="hsl(var(--brand-600))"
                    stroke="hsl(var(--background-surface-100))"
                    strokeWidth={1}
                  />
                  {country.requests / maxRequests > 0.22 && (
                    <text
                      y={-radius - 5}
                      textAnchor="middle"
                      className="fill-foreground text-[9px] font-semibold [paint-order:stroke] [stroke:var(--background-surface-100)] [stroke-width:3px] [stroke-linejoin:round]"
                    >
                      {country.code}
                    </text>
                  )}
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        <div className="absolute bottom-3 left-4 rounded border bg-surface-100/95 px-2 py-1 text-xs text-foreground-lighter shadow-sm backdrop-blur">
          Select a country to compare its request volume
        </div>
      </div>
      <BubbleLegend maxRequests={maxRequests} />
    </div>
  )
}

const CountryRanking = ({
  countries,
  totalRequests,
  selectedCode,
  onSelect,
}: {
  countries: GeographicUsageCountry[]
  totalRequests: number
  selectedCode?: GeographicUsageCountry['code']
  onSelect: (code: GeographicUsageCountry['code']) => void
}) => (
  <aside aria-labelledby="top-countries-heading" className="min-w-0 bg-surface-100">
    <div className="flex h-[62px] items-center justify-between border-b px-4">
      <div>
        <h3 id="top-countries-heading" className="text-sm font-medium text-foreground">
          Top countries
        </h3>
        <p className="mt-0.5 text-xs text-foreground-lighter">Requests · Share of total</p>
      </div>
    </div>
    <ol>
      {countries.slice(0, 6).map((country, index) => {
        const name = iso2ToCountryName(country.code)
        const isSelected = country.code === selectedCode
        const share = totalRequests > 0 ? (country.requests / totalRequests) * 100 : 0

        return (
          <li key={country.code} className="border-b last:border-b-0">
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(country.code)}
              className={cn(
                'grid h-[61px] w-full grid-cols-[1rem_1.5rem_minmax(0,1fr)_auto] items-center gap-2 px-4 text-left transition-colors hover:bg-surface-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                isSelected && 'bg-brand-200/30'
              )}
            >
              <span className="text-xs text-foreground-muted">{index + 1}</span>
              <span aria-hidden="true" className="text-base">
                {country.flag}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">{name}</span>
                <span className="block text-xs text-foreground-lighter">
                  {formatPercent(share)} of requests
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm text-foreground">
                  {country.requests.toLocaleString()}
                </span>
                <span
                  className={cn(
                    'block text-xs',
                    country.change >= 0 ? 'text-brand-600' : 'text-warning-600'
                  )}
                >
                  {country.change >= 0 ? '↑' : '↓'} {Math.abs(country.change).toFixed(1)}%
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  </aside>
)

const SummaryMetric = ({
  label,
  value,
  note,
  positive = false,
}: {
  label: string
  value: string
  note: string
  positive?: boolean
}) => (
  <div className="flex min-h-24 flex-col justify-center gap-1 border-r px-5 last:border-r-0 max-md:border-b max-md:odd:border-r max-md:even:border-r-0 max-md:[&:nth-last-child(-n+2)]:border-b-0">
    <span className="text-xs text-foreground-lighter">{label}</span>
    <strong className="text-2xl font-medium tracking-tight text-foreground">{value}</strong>
    <span className={cn('text-xs text-foreground-lighter', positive && 'text-brand-600')}>
      {note}
    </span>
  </div>
)

export const GeographicUsageSection = () => {
  const [range, setRange] = useState<GeographicUsageRange>('24h')
  const [selectedCode, setSelectedCode] = useState<GeographicUsageCountry['code']>()
  const multiplier = RANGE_OPTIONS[range].multiplier
  const countries = useMemo(
    () =>
      PREVIEW_COUNTRIES.map((country) => ({
        ...country,
        requests: Math.round(country.requests * multiplier),
      })),
    [multiplier]
  )
  const locatedRequests = countries.reduce((sum, country) => sum + country.requests, 0)
  const totalRequests = Math.round(locatedRequests / 0.958)

  return (
    <section aria-labelledby="geographic-usage-title" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground-lighter">
            <Database size={14} /> Database
          </div>
          <div className="flex items-center gap-2">
            <h2 id="geographic-usage-title" className="text-xl font-medium text-foreground">
              Database usage by location
            </h2>
            <Badge variant="success">Beta</Badge>
          </div>
          <p className="mt-1 text-sm text-foreground-lighter">
            See where aggregated database requests originated during the selected period.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center rounded-md border bg-surface-200 p-0.5">
            <button
              type="button"
              aria-pressed="true"
              className="flex h-6 items-center gap-1.5 rounded bg-surface-100 px-2 text-xs text-foreground shadow-sm"
            >
              <MapIcon size={14} /> Map
            </button>
          </div>
          <Select value={range} onValueChange={(value) => setRange(value as GeographicUsageRange)}>
            <SelectTrigger aria-label="Time range" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {Object.entries(RANGE_OPTIONS).map(([value, option]) => (
                <SelectItem key={value} value={value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-surface-100">
        <div className="grid grid-cols-4 max-md:grid-cols-2">
          <SummaryMetric
            label="Total database requests"
            value={totalRequests.toLocaleString()}
            note="↑ 11.8% vs previous period"
            positive
          />
          <SummaryMetric
            label="Located requests"
            value="95.8%"
            note={`${locatedRequests.toLocaleString()} requests`}
          />
          <SummaryMetric
            label="Countries with eligible data"
            value="24"
            note="Minimum 25 requests"
          />
          <SummaryMetric label="Last updated" value="8 min ago" note="Sep 21, 1:40 PM UTC" />
        </div>

        <div className="grid border-t lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)]">
          <GeographicRequestMap
            countries={countries}
            selectedCode={selectedCode}
            onSelect={setSelectedCode}
          />
          <CountryRanking
            countries={countries}
            totalRequests={totalRequests}
            selectedCode={selectedCode}
            onSelect={setSelectedCode}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs leading-relaxed text-foreground-lighter">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Locations are inferred from request IP addresses and may be approximate. Results are
          aggregated by country; raw IP addresses and exact coordinates are never shown.
        </p>
      </div>
    </section>
  )
}

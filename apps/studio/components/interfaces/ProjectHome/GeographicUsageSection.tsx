import { useParams } from 'common'
import { Database, Info } from 'lucide-react'
import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from 'ui'

import { COUNTRY_LAT_LON } from '@/components/interfaces/ProjectCreation/ProjectCreation.constants'
import {
  extractIso2FromFeatureProps,
  isKnownCountryCode,
  iso2ToCountryName,
} from '@/components/interfaces/Reports/utils/geo'
import { AlertError } from '@/components/ui/AlertError'
import {
  useGeographicUsageQuery,
  type GeographicUsage,
  type GeographicUsageCountry,
  type GeographicUsageRange,
} from '@/data/analytics/geographic-usage-query'
import { BASE_PATH } from '@/lib/constants'

const RANGE_OPTIONS: { value: GeographicUsageRange; label: string }[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

const formatRequests = (value: number) => value.toLocaleString()

const formatPercent = (value: number) => `${value.toFixed(1)}%`

const formatUpdatedMinutesAgo = (timestamp: string) => {
  const minutesAgo = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000))
  return minutesAgo < 1 ? 'Just now' : `${minutesAgo} min ago`
}

const SummaryMetric = ({ label, value, note }: { label: string; value: string; note: string }) => (
  <div className="flex min-h-24 flex-col justify-center gap-1 border-r px-5 last:border-r-0 max-md:border-b max-md:odd:border-r max-md:even:border-r-0 max-md:[&:nth-last-child(-n+2)]:border-b-0">
    <span className="text-xs text-foreground-lighter">{label}</span>
    <strong className="text-2xl font-medium tracking-tight text-foreground">{value}</strong>
    <span className="text-xs text-foreground-lighter">{note}</span>
  </div>
)

const GeographicUsageLoading = () => (
  <div
    className="overflow-hidden rounded-lg border bg-surface-100"
    aria-label="Loading geographic usage"
  >
    <div className="grid grid-cols-4 max-md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex min-h-24 flex-col justify-center gap-2 border-r px-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
    <div className="grid min-h-[420px] grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)] border-t max-lg:grid-cols-1">
      <Skeleton className="min-h-[420px] rounded-none" />
      <div className="space-y-4 p-4 max-lg:hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  </div>
)

const getMarkerRadius = (requests: number, maxRequests: number) => {
  if (maxRequests <= 0) return 5
  return 5 + Math.sqrt(requests / maxRequests) * 15
}

const RequestMap = ({
  countries,
  selectedCode,
  onSelect,
}: {
  countries: GeographicUsageCountry[]
  selectedCode: string | undefined
  onSelect: (code: string) => void
}) => {
  const maxRequests = Math.max(...countries.map((country) => country.requests), 0)
  const countriesByCode = new Map(countries.map((country) => [country.code, country]))

  return (
    <div className="min-w-0 border-r max-lg:border-b lg:border-r">
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
            <Geographies geography={`${BASE_PATH}/json/worldmap.json`}>
              {({ geographies }) =>
                geographies.map((geography) => {
                  const code = extractIso2FromFeatureProps(
                    geography.properties as Record<string, unknown> | undefined
                  )
                  const country = code ? countriesByCode.get(code) : undefined
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
                          ? `${iso2ToCountryName(country.code)}: ${formatRequests(country.requests)} requests`
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
                        pressed: { fill: 'var(--background-surface-400)', outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {countries.flatMap((country) => {
              if (!isKnownCountryCode(country.code)) return []

              const coordinates = COUNTRY_LAT_LON[country.code]
              const radius = getMarkerRadius(country.requests, maxRequests)
              const isSelected = selectedCode === country.code
              const name = iso2ToCountryName(country.code)

              return [
                <Marker
                  key={country.code}
                  coordinates={[coordinates.lon, coordinates.lat]}
                  role="button"
                  tabIndex={0}
                  aria-label={`${name}: ${formatRequests(country.requests)} requests`}
                  aria-pressed={isSelected}
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
                </Marker>,
              ]
            })}
          </ZoomableGroup>
        </ComposableMap>
        <div className="absolute bottom-3 left-4 rounded border bg-surface-100/95 px-2 py-1 text-xs text-foreground-lighter shadow-sm backdrop-blur">
          Select a country to compare its request volume
        </div>
      </div>
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
        <span>{formatRequests(maxRequests)}+</span>
      </div>
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
  selectedCode: string | undefined
  onSelect: (code: string) => void
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
            <Button
              type="button"
              variant="ghost"
              aria-pressed={isSelected}
              onClick={() => onSelect(country.code)}
              className={`grid h-[61px] w-full grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-2 rounded-none px-4 text-left ${isSelected ? 'bg-brand-200/30' : ''}`}
            >
              <span className="text-xs text-foreground-muted">{index + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">{name}</span>
                <span className="block text-xs text-foreground-lighter">
                  {formatPercent(share)} of requests
                </span>
              </span>
              <span className="text-right text-sm text-foreground">
                {formatRequests(country.requests)}
              </span>
            </Button>
          </li>
        )
      })}
    </ol>
  </aside>
)

const GeographicUsageContent = ({
  usage,
  selectedCode,
  onSelectCountry,
}: {
  usage: GeographicUsage
  selectedCode: string | undefined
  onSelectCountry: (code: string) => void
}) => (
  <>
    <div className="overflow-hidden rounded-lg border bg-surface-100">
      <div className="grid grid-cols-4 max-md:grid-cols-2">
        <SummaryMetric
          label="Total database requests"
          value={formatRequests(usage.totalRequests)}
          note="During the selected period"
        />
        <SummaryMetric
          label="Located requests"
          value={formatPercent(usage.coveragePercent)}
          note={`${formatRequests(usage.locatedRequests)} requests`}
        />
        <SummaryMetric
          label="Countries with eligible data"
          value={String(usage.eligibleCountryCount)}
          note={`Minimum ${usage.minimumRequests} requests`}
        />
        <SummaryMetric
          label="Last updated"
          value={formatUpdatedMinutesAgo(usage.lastUpdated)}
          note={`${new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC',
          }).format(new Date(usage.lastUpdated))} UTC`}
        />
      </div>

      <div className="grid border-t lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)]">
        <RequestMap
          countries={usage.countries}
          selectedCode={selectedCode}
          onSelect={onSelectCountry}
        />
        <CountryRanking
          countries={usage.countries}
          totalRequests={usage.totalRequests}
          selectedCode={selectedCode}
          onSelect={onSelectCountry}
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
  </>
)

export const GeographicUsageSection = () => {
  const { ref: projectRef } = useParams()
  const [range, setRange] = useState<GeographicUsageRange>('24h')
  const [selectedCode, setSelectedCode] = useState<string>()
  const { data, isPending, isError, error } = useGeographicUsageQuery({ projectRef, range })

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

        <Select value={range} onValueChange={(value) => setRange(value as GeographicUsageRange)}>
          <SelectTrigger aria-label="Time range" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending && <GeographicUsageLoading />}
      {isError && (
        <AlertError subject="Failed to retrieve geographic database usage" error={error} />
      )}
      {data && (
        <GeographicUsageContent
          usage={data}
          selectedCode={selectedCode}
          onSelectCountry={setSelectedCode}
        />
      )}
    </section>
  )
}

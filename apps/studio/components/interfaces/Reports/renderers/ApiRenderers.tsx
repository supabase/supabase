import { useParams } from 'common'
import { COUNTRY_LAT_LON } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import {
  MAP_CHART_THEME,
  buildCountsByIso2,
  computeMarkerRadius,
  extractIso2FromFeatureProps,
  getFillColor,
  getFillOpacity,
  isKnownCountryCode,
  isMicroCountry,
  iso2ToCountryName,
} from 'components/interfaces/Reports/utils/geo'
import {
  TextFormatter,
  jsonSyntaxHighlight,
} from 'components/interfaces/Settings/Logs/LogsFormatters'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import BarChart from 'components/ui/Charts/BarChart'
import { geoCentroid } from 'd3-geo'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { BASE_PATH } from 'lib/constants'
import sumBy from 'lodash/sumBy'
import { ChevronRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Fragment, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import type { ResponseError } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Collapsible,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  WarningIcon,
} from 'ui'
import * as z from 'zod'

import { ReportWidgetProps, ReportWidgetRendererProps } from '../ReportWidget'
import { queryParamsToObject } from '../Reports.utils'

export const NetworkTrafficRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    ingress: number
    egress: number
  }>
) => {
  const { data, error, isError } = useFillTimeseriesSorted({
    data: props.data,
    timestampKey: 'timestamp',
    valueKey: ['ingress_mb', 'egress_mb'],
    defaultValue: 0,
    startDate: props.params?.iso_timestamp_start,
    endDate: props.params?.iso_timestamp_end,
  })

  const totalIngress = sumBy(props.data, 'ingress_mb')
  const totalEgress = sumBy(props.data, 'egress_mb')

  function determinePrecision(valueInMb: number) {
    return valueInMb < 0.001 ? 7 : totalIngress > 1 ? 2 : 4
  }

  if (!!props.error) {
    const error = (
      typeof props.error === 'string' ? { message: props.error } : props.error
    ) as ResponseError
    return <AlertError subject="Failed to retrieve network traffic" error={error} />
  } else if (isError) {
    return (
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve network traffic</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{error?.message ?? 'Unknown error'}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <div className="flex flex-col gap-12 w-full">
      <BarChart
        size="small"
        title="Ingress"
        highlightedValue={sumBy(props.data, 'ingress_mb')}
        format="MB"
        className="w-full"
        valuePrecision={determinePrecision(totalIngress)}
        data={data}
        yAxisKey="ingress_mb"
        xAxisKey="timestamp"
        displayDateInUtc
      />

      <BarChart
        size="small"
        title="Egress"
        highlightedValue={totalEgress}
        format="MB"
        valuePrecision={determinePrecision(totalEgress)}
        className="w-full"
        data={data}
        yAxisKey="egress_mb"
        xAxisKey="timestamp"
        displayDateInUtc
      />
    </div>
  )
}

export const TotalRequestsChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + datum.count
  }, 0)
  const { data, error, isError } = useFillTimeseriesSorted({
    data: props.data,
    timestampKey: 'timestamp',
    valueKey: 'count',
    defaultValue: 0,
    startDate: props.params?.iso_timestamp_start,
    endDate: props.params?.iso_timestamp_end,
  })

  if (!!props.error) {
    const error = (
      typeof props.error === 'string' ? { message: props.error } : props.error
    ) as ResponseError
    return <AlertError subject="Failed to retrieve total requests" error={error} />
  } else if (isError) {
    return (
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve total requests</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{error?.message ?? 'Unknown error'}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <BarChart
      size="small"
      minimalHeader
      highlightedValue={total}
      className="w-full"
      data={data}
      yAxisKey="count"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const TopApiRoutesRenderer = (
  props: ReportWidgetRendererProps<{
    method: string
    // shown for error table but not all requests table
    status_code?: number
    path: string
    search: string
    count: number
    // used for response speed table only
    avg?: number
  }>
) => {
  const { ref: projectRef } = useParams()
  const [showMore, setShowMore] = useState(false)

  const headerClasses = '!text-xs !py-2 p-0 font-bold !bg-surface-200 !border-x-0 !rounded-none'
  const cellClasses = '!text-xs !py-2 !border-x-0 !rounded-none align-middle'

  if (props.data.length === 0) return null

  return (
    <Collapsible>
      <Table
        className="rounded-t-none"
        head={
          <>
            <Table.th className={headerClasses}>Request</Table.th>
            <Table.th className={headerClasses + ' text-right'}>Count</Table.th>
            {props.data[0].avg !== undefined && (
              <Table.th className={headerClasses + ' text-right'}>Avg</Table.th>
            )}
          </>
        }
        body={
          <>
            {props.data.map((datum, index) => (
              <Fragment key={index + datum.method + datum.path + (datum.search || '')}>
                <Table.tr
                  className={[
                    'p-0 transition transform cursor-pointer hover:bg-surface-200',
                    showMore && index >= 3 ? 'w-full h-full opacity-100' : '',
                    !showMore && index >= 3 ? ' w-0 h-0 translate-y-10 opacity-0' : '',
                  ].join(' ')}
                >
                  {(!showMore && index < 3) || showMore ? (
                    <>
                      <Table.td className={[cellClasses].join(' ')}>
                        <RouteTdContent {...datum} />
                      </Table.td>
                      <Table.td className={[cellClasses, 'text-right align-top'].join(' ')}>
                        {datum.count}
                      </Table.td>
                      {props.data[0].avg !== undefined && (
                        <Table.td className={[cellClasses, 'text-right align-top'].join(' ')}>
                          {Number(datum.avg).toFixed(2)}ms
                        </Table.td>
                      )}
                    </>
                  ) : null}
                </Table.tr>
              </Fragment>
            ))}
          </>
        }
      />
      <Collapsible.Trigger asChild>
        <div className="flex flex-row justify-end w-full gap-2 p-1">
          <Button
            type="text"
            onClick={() => setShowMore(!showMore)}
            className={[
              'transition',
              showMore ? 'text-foreground' : 'text-foreground-lighter',
              props.data.length <= 3 ? 'hidden' : '',
            ].join(' ')}
          >
            {!showMore ? 'Show more' : 'Show less'}
          </Button>
        </div>
      </Collapsible.Trigger>
    </Collapsible>
  )
}

export const ErrorCountsChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + datum.count
  }, 0)

  const { data, error, isError } = useFillTimeseriesSorted({
    data: props.data,
    timestampKey: 'timestamp',
    valueKey: 'count',
    defaultValue: 0,
    startDate: props.params?.iso_timestamp_start,
    endDate: props.params?.iso_timestamp_end,
  })

  if (!!props.error) {
    const error = (
      typeof props.error === 'string' ? { message: props.error } : props.error
    ) as ResponseError
    return <AlertError subject="Failed to retrieve request errors" error={error} />
  } else if (isError) {
    return (
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve request errors</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{error?.message ?? 'Unknown error'}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <BarChart
      size="small"
      minimalHeader
      className="w-full"
      highlightedValue={total}
      data={data}
      yAxisKey="count"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const ResponseSpeedChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    avg: number
  }>
) => {
  const transformedData = props.data.map((datum) => ({
    timestamp: datum.timestamp,
    avg: datum.avg,
  }))

  const { data, error, isError } = useFillTimeseriesSorted({
    data: transformedData,
    timestampKey: 'timestamp',
    valueKey: 'avg',
    defaultValue: 0,
    startDate: props.params?.iso_timestamp_start,
    endDate: props.params?.iso_timestamp_end,
  })

  const lastAvg = props.data[props.data.length - 1]?.avg

  if (!!props.error) {
    const error = (
      typeof props.error === 'string' ? { message: props.error } : props.error
    ) as ResponseError
    return <AlertError subject="Failed to retrieve response speeds" error={error} />
  } else if (isError) {
    return (
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve response speeds</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{error?.message ?? 'Unknown error'}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <BarChart
      size="small"
      highlightedValue={lastAvg}
      format="ms"
      minimalHeader
      className="w-full"
      data={data}
      yAxisKey="avg"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

interface RouteTdContentProps {
  method: string
  status_code?: number
  path: string
  search: string
}
const RouteTdContent = (datum: RouteTdContentProps) => (
  <Collapsible_Shadcn_>
    <CollapsibleTrigger_Shadcn_ asChild>
      <div className="flex gap-2 items-center">
        <Button asChild type="text" className=" !py-0 !p-1" title="Show more route details">
          <span>
            <ChevronRight
              size={14}
              className="transition data-open-parent:rotate-90 data-closed-parent:rotate-0"
            />
          </span>
        </Button>
        <TextFormatter
          className="w-10 h-4 text-center rounded bg-surface-300"
          value={datum.method}
        />
        {datum.status_code && (
          <TextFormatter
            className={`w-10 h-4 text-center rounded ${
              datum.status_code >= 400
                ? 'bg-orange-500'
                : datum.status_code >= 300
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            value={String(datum.status_code)}
          />
        )}
        <div className=" truncate max-w-sm lg:max-w-lg">
          <TextFormatter className="text-foreground-light" value={datum.path} />
          <TextFormatter
            className="max-w-sm text-foreground-lighter truncate "
            value={decodeURIComponent(datum.search || '')}
          />
        </div>
      </div>
    </CollapsibleTrigger_Shadcn_>
    <CollapsibleContent_Shadcn_ className="pt-2">
      {datum.search ? (
        <pre className={`syntax-highlight overflow-auto rounded bg-surface-100 p-2 !text-xs`}>
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: jsonSyntaxHighlight(queryParamsToObject(datum.search)),
            }}
          />
        </pre>
      ) : (
        <p className="text-xs text-foreground-lighter">No query parameters in this request</p>
      )}
    </CollapsibleContent_Shadcn_>
  </Collapsible_Shadcn_>
)
export const RequestsByCountryMapRenderer = (
  props: ReportWidgetProps<{
    country: string | null
    count: number
  }>
) => {
  const WORLD_TOPO_URL = `${BASE_PATH}/json/worldmap.json`
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoverInfo, setHoverInfo] = useState<{
    x: number
    y: number
    title: string
    subtitle: string
    visible: boolean
  }>({ x: 0, y: 0, title: '', subtitle: '', visible: false })

  const countsByIso2 = buildCountsByIso2(props.data)
  const max = Object.values(countsByIso2).reduce((m, v) => (v > m ? v : m), 0)
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? MAP_CHART_THEME.dark : MAP_CHART_THEME.light

  if (!!props.error) {
    const AlertErrorSchema = z.object({ message: z.string() })
    const parsed =
      typeof props.error === 'string'
        ? { success: true, data: { message: props.error } }
        : AlertErrorSchema.safeParse(props.error)
    const alertError = parsed.success ? parsed.data : null
    return <AlertError subject="Failed to retrieve requests by geography" error={alertError} />
  }

  return (
    <div ref={containerRef} className="w-full h-[420px] relative border-t">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 155 }}
        className="w-full h-full"
        style={{ backgroundColor: theme.oceanFill }}
      >
        <ZoomableGroup minZoom={1} maxZoom={5} zoom={1.3}>
          <Geographies geography={WORLD_TOPO_URL}>
            {({ geographies }) => (
              <>
                {geographies.map((geo) => {
                  const title =
                    (geo.properties?.name as string) ||
                    (geo.properties?.NAME as string) ||
                    'Unknown'
                  const iso2 = extractIso2FromFeatureProps(
                    (geo.properties || undefined) as Record<string, unknown> | undefined
                  )
                  // Skip Antarctica entirely (causes hover issues)
                  if ((title || '').toLowerCase() === 'antarctica') {
                    return null
                  }
                  const value = iso2 ? countsByIso2[iso2] || 0 : 0
                  const baseOpacity = getFillOpacity(value, max, theme)
                  const tooltipTitle = title
                  const tooltipSubtitle = `${value.toLocaleString()} requests`
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseMove={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect()
                        const x = (rect ? e.clientX - rect.left : e.clientX) + 12
                        const y = (rect ? e.clientY - rect.top : e.clientY) + 12
                        setHoverInfo({
                          x,
                          y,
                          title: tooltipTitle,
                          subtitle: tooltipSubtitle,
                          visible: true,
                        })
                      }}
                      onMouseEnter={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect()
                        const x = (rect ? e.clientX - rect.left : e.clientX) + 12
                        const y = (rect ? e.clientY - rect.top : e.clientY) + 12
                        setHoverInfo({
                          x,
                          y,
                          title: tooltipTitle,
                          subtitle: tooltipSubtitle,
                          visible: true,
                        })
                      }}
                      onMouseLeave={() => setHoverInfo((prev) => ({ ...prev, visible: false }))}
                      style={{
                        default: {
                          fill: getFillColor(value, max, theme),
                          stroke: theme.boundaryStroke,
                          strokeWidth: 0.4,
                          opacity: baseOpacity,
                          outline: 'none',
                          cursor: 'default',
                        },
                        hover: {
                          fill: getFillColor(value, max, theme),
                          stroke: 'transparent',
                          strokeWidth: 0,
                          opacity: Math.max(0, baseOpacity * 0.8),
                          outline: 'none',
                          cursor: 'default',
                        },
                        pressed: {
                          fill: getFillColor(value, max, theme),
                          stroke: 'transparent',
                          strokeWidth: 0,
                          opacity: Math.max(0, baseOpacity * 0.8),
                          outline: 'none',
                          cursor: 'default',
                        },
                      }}
                      aria-label={`${tooltipTitle} — ${tooltipSubtitle}`}
                    />
                  )
                })}

                {geographies.map((geo) => {
                  const title =
                    (geo.properties?.name as string) ||
                    (geo.properties?.NAME as string) ||
                    'Unknown'
                  if (!isMicroCountry(title)) return null
                  const iso2 = extractIso2FromFeatureProps(
                    (geo.properties || undefined) as Record<string, unknown> | undefined
                  )
                  const value = iso2 ? countsByIso2[iso2] || 0 : 0
                  if (value <= 0) return null
                  const [lon, lat] = geoCentroid(geo)
                  const r = computeMarkerRadius(value, max)
                  const tooltipTitle = title
                  const tooltipSubtitle = `${value.toLocaleString()} requests`
                  return (
                    <Marker
                      key={`marker-${geo.rsmKey}`}
                      coordinates={[lon, lat]}
                      onMouseMove={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect()
                        const x = (rect ? e.clientX - rect.left : e.clientX) + 12
                        const y = (rect ? e.clientY - rect.top : e.clientY) + 12
                        setHoverInfo({
                          x,
                          y,
                          title: tooltipTitle,
                          subtitle: tooltipSubtitle,
                          visible: true,
                        })
                      }}
                      onMouseEnter={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect()
                        const x = (rect ? e.clientX - rect.left : e.clientX) + 12
                        const y = (rect ? e.clientY - rect.top : e.clientY) + 12
                        setHoverInfo({
                          x,
                          y,
                          title: tooltipTitle,
                          subtitle: tooltipSubtitle,
                          visible: true,
                        })
                      }}
                      onMouseLeave={() => setHoverInfo((prev) => ({ ...prev, visible: false }))}
                    >
                      <circle r={r} fill={theme.markerFill} />
                    </Marker>
                  )
                })}

                {(() => {
                  const present = new Set<string>()
                  for (const g of geographies) {
                    const code = extractIso2FromFeatureProps(
                      (g.properties || undefined) as Record<string, unknown> | undefined
                    )
                    if (code) present.add(code)
                  }

                  const markers: JSX.Element[] = []
                  for (const iso2 in countsByIso2) {
                    const count = countsByIso2[iso2]
                    if (count <= 0) continue
                    // Do not render Antarctica
                    if (iso2.toUpperCase() === 'AQ') continue
                    if (present.has(iso2)) continue
                    if (!isKnownCountryCode(iso2)) continue
                    const ll = COUNTRY_LAT_LON[iso2]
                    const r = computeMarkerRadius(count, max)
                    const tooltipTitle = iso2ToCountryName(iso2)
                    const tooltipSubtitle = `${count.toLocaleString()} requests`
                    markers.push(
                      <Marker
                        key={`fallback-${iso2}`}
                        coordinates={[ll.lon, ll.lat]}
                        onMouseMove={(e) => {
                          const rect = containerRef.current?.getBoundingClientRect()
                          const x = (rect ? e.clientX - rect.left : e.clientX) + 12
                          const y = (rect ? e.clientY - rect.top : e.clientY) + 12
                          setHoverInfo({
                            x,
                            y,
                            title: tooltipTitle,
                            subtitle: tooltipSubtitle,
                            visible: true,
                          })
                        }}
                        onMouseEnter={(e) => {
                          const rect = containerRef.current?.getBoundingClientRect()
                          const x = (rect ? e.clientX - rect.left : e.clientX) + 12
                          const y = (rect ? e.clientY - rect.top : e.clientY) + 12
                          setHoverInfo({
                            x,
                            y,
                            title: tooltipTitle,
                            subtitle: tooltipSubtitle,
                            visible: true,
                          })
                        }}
                        onMouseLeave={() => setHoverInfo((prev) => ({ ...prev, visible: false }))}
                      >
                        <circle r={r} fill={theme.markerFill} />
                      </Marker>
                    )
                  }

                  return markers
                })()}
              </>
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {hoverInfo.visible && (
        <div
          className="pointer-events-none absolute z-10 rounded bg-surface-100 p-1.5 border border-surface-200 text-sm"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <h3 className="text-foreground-lighter text-sm">{hoverInfo.title}</h3>
          <p className="text-foreground text-sm">{hoverInfo.subtitle}</p>
        </div>
      )}
    </div>
  )
}

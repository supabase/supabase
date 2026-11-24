import type { DataKey } from 'recharts/types/util/types'

import type { Datum } from './Charts.types'
import type { ThresholdZone } from './ComposedChart.utils'

export type ThresholdZoneRun = {
  startIndex: number
  endIndex: number
  lower: number
  upper: number
}

export function getThresholdZoneRuns(ranges: ([number, number] | null)[]): ThresholdZoneRun[] {
  return ranges.reduce<ThresholdZoneRun[]>((runs, range, index) => {
    if (!range) return runs

    const previous = runs[runs.length - 1]
    if (
      previous?.endIndex === index - 1 &&
      previous.lower === range[0] &&
      previous.upper === range[1]
    ) {
      previous.endIndex = index
      return runs
    }

    runs.push({ startIndex: index, endIndex: index, lower: range[0], upper: range[1] })
    return runs
  }, [])
}

export function getThresholdZoneXBounds(
  run: ThresholdZoneRun,
  data: Datum[],
  hasVisibleBars: boolean,
  dataKey?: DataKey<Datum>
) {
  const getValue = (index: number): string | number | undefined => {
    if (dataKey === undefined) return index
    if (typeof dataKey === 'function') return dataKey(data[index])
    return data[index]?.[dataKey]
  }

  const endIndex = hasVisibleBars ? run.endIndex : run.endIndex + 1
  return {
    x1: run.startIndex === 0 ? undefined : getValue(run.startIndex),
    x2: run.endIndex === data.length - 1 ? undefined : getValue(endIndex),
  }
}

export function getThresholdZoneYBounds(run: ThresholdZoneRun, previousRun?: ThresholdZoneRun) {
  if (!previousRun || previousRun.endIndex !== run.startIndex - 1) {
    return { y1: run.lower, y2: run.lower }
  }
  return { y1: run.lower, y2: previousRun.lower }
}

export function getHighestCrossedThresholdZone(
  data: Datum[],
  zones: { runs: ThresholdZoneRun[]; isAlwaysVisible?: boolean }[],
  attribute?: string
): number | undefined {
  if (!attribute) return undefined

  for (let zoneIndex = zones.length - 1; zoneIndex >= 0; zoneIndex--) {
    if (zones[zoneIndex].isAlwaysVisible) continue
    for (const run of zones[zoneIndex].runs) {
      if (!Number.isFinite(run.lower)) continue
      for (let sampleIndex = run.startIndex; sampleIndex <= run.endIndex; sampleIndex++) {
        const value = data[sampleIndex]?.[attribute]
        if (
          typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= 0 &&
          value > run.lower
        ) {
          return zoneIndex
        }
      }
    }
  }
  return undefined
}

export function getThresholdZoneMaximum(zones: { runs: ThresholdZoneRun[] }[]): number {
  return zones.reduce(
    (maximum, zone) =>
      zone.runs.reduce(
        (zoneMaximum, run) =>
          Number.isFinite(run.upper) ? Math.max(zoneMaximum, run.upper) : zoneMaximum,
        maximum
      ),
    0
  )
}

export function getThresholdZoneChart(
  data: Datum[],
  thresholdZones?: ThresholdZone[],
  thresholdZoneAttribute?: string
) {
  const zones =
    thresholdZones?.map((zone) => ({
      ...zone,
      runs: getThresholdZoneRuns(zone.getRanges(data)),
    })) ?? []
  const selectedIndex = getHighestCrossedThresholdZone(data, zones, thresholdZoneAttribute)
  const selectedZone = selectedIndex === undefined ? undefined : zones[selectedIndex]
  let visibleZones = zones
  if (thresholdZoneAttribute) {
    visibleZones = zones.filter((zone) => zone.isAlwaysVisible || zone === selectedZone)
  }
  const maxValue = getThresholdZoneMaximum(zones)
  return { zones: visibleZones, maxValue, selectedZone }
}

type ThresholdZoneValue = {
  label: string
  color: string
  value: number
}

export function getThresholdZoneValues(
  point: Datum | undefined,
  zones: ThresholdZone[] | undefined
): ThresholdZoneValue[] {
  if (!point || !zones) return []

  const values: ThresholdZoneValue[] = []
  for (const zone of zones) {
    const range = zone.getRanges([point])[0]
    if (!range) continue

    const [value] = range
    if (!Number.isFinite(value)) continue

    values.push({ label: zone.tooltipLabel ?? zone.label, color: zone.color, value })
  }
  return values
}

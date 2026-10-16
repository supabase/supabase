import type { DataKey } from 'recharts/types/util/types'

import type { Datum } from './Charts.types'

export type ReferenceZoneRun = {
  startIndex: number
  endIndex: number
  lower: number
  upper: number
}

export function getReferenceZoneRuns(ranges: ([number, number] | null)[]): ReferenceZoneRun[] {
  return ranges.reduce<ReferenceZoneRun[]>((runs, range, index) => {
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

export function getReferenceZoneXBounds(
  run: ReferenceZoneRun,
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

export function getEmphasizedReferenceZones(
  data: Datum[],
  zones: { runs: ReferenceZoneRun[] }[],
  attribute?: string
): Set<number> {
  const allZones = new Set(zones.map((_, index) => index))
  const value = attribute ? data[data.length - 1]?.[attribute] : undefined
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return allZones

  const thresholds: { value: number; index: number }[] = []
  for (const [index, zone] of zones.entries()) {
    const latest = zone.runs[zone.runs.length - 1]
    if (latest?.endIndex !== data.length - 1 || !Number.isFinite(latest.lower)) return allZones
    thresholds.push({ value: latest.lower, index })
  }
  thresholds.sort((a, b) => a.value - b.value)
  if (thresholds.length === 0) return allZones

  const next = thresholds.findIndex((threshold) => threshold.value > value)
  if (next === 0) return new Set([thresholds[0].index])
  if (next === -1) return new Set([thresholds[thresholds.length - 1].index])
  return new Set([thresholds[next - 1].index, thresholds[next].index])
}

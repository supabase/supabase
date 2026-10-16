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

import { LAYOUT_COLUMN_COUNT } from './Reports.constants'
import type { Dashboards } from '@/types'

export function appendReportCharts(
  layout: Dashboards.Chart[],
  charts: Dashboards.Chart[]
): Dashboards.Chart[] {
  const updatedLayout = [...layout]

  for (const chart of charts) {
    const isAlreadyAdded = updatedLayout.some(
      (existing) => existing.attribute === chart.attribute || existing.id === chart.id
    )
    if (isAlreadyAdded) continue

    const rows = [
      ...new Set([
        0,
        ...updatedLayout.flatMap((existing) => [existing.y, existing.y + existing.h]),
      ]),
    ].sort((a, b) => a - b)
    const positions = rows.flatMap((y) =>
      Array.from({ length: LAYOUT_COLUMN_COUNT - chart.w + 1 }, (_, x) => ({ x, y }))
    )
    const position = positions.find(({ x, y }) =>
      updatedLayout.every(
        (existing) =>
          x + chart.w <= existing.x ||
          x >= existing.x + existing.w ||
          y + chart.h <= existing.y ||
          y >= existing.y + existing.h
      )
    )

    if (position) updatedLayout.push({ ...chart, ...position })
  }

  return updatedLayout
}

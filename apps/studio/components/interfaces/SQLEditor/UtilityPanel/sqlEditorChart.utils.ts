import dayjs from 'dayjs'
import type { ChartBarTick } from 'ui-patterns/Chart'

export type SqlEditorXKeyFormat = 'date' | 'number' | 'string'

export type SqlEditorChartConfig = {
  view?: 'table' | 'chart'
  type: 'bar' | 'line'
  cumulative: boolean
  xKey: string
  yKey: string
  showLabels?: boolean
  showGrid?: boolean
  logScale?: boolean
}

export type SqlChartTick = ChartBarTick & {
  /** Original X value for tooltips when the axis is not temporal */
  _xLabel?: string
}

type Results = { rows: readonly Record<string, unknown>[] }

const VALID_RESULT_KEY_TYPES = ['number', 'string', 'date'] as const

export function getSqlEditorResultKeys(results: Results) {
  return Object.keys(results.rows[0] || {}).filter((key) => {
    const type = typeof results.rows[0][key]
    return VALID_RESULT_KEY_TYPES.includes(type as (typeof VALID_RESULT_KEY_TYPES)[number])
  })
}

export function getSqlEditorYAxisKeys(results: Results) {
  if (!results.rows[0]) return []

  return Object.keys(results.rows[0]).filter((key) => {
    const value = results.rows[0][key]
    return typeof value === 'number' || !Number.isNaN(Number(value))
  })
}

export function getSqlEditorXKeyFormat(sampleValue: unknown): SqlEditorXKeyFormat {
  if (typeof sampleValue === 'number') return 'number'
  if (dayjs(sampleValue).isValid()) return 'date'
  return 'string'
}

export function getCumulativeSqlChartRows(results: Results, config: SqlEditorChartConfig) {
  if (!results?.rows?.length) {
    return []
  }

  return results.rows.reduce<Record<string, unknown>[]>((acc, row) => {
    const prev = acc[acc.length - 1] || {}
    const previousY = Number(prev[config.yKey] ?? 0)
    const nextY = Number(row[config.yKey] ?? 0)

    return [
      ...acc,
      {
        ...row,
        [config.yKey]: previousY + nextY,
      },
    ]
  }, [])
}

function isEpochNumericValue(value: number) {
  return value > 1_000_000_000
}

export function sqlRowsToChartTicks(
  rows: readonly Record<string, unknown>[],
  xKey: string,
  yKey: string,
  xKeyFormat: SqlEditorXKeyFormat
): SqlChartTick[] {
  return rows.map((row, index) => {
    const xValue = row[xKey]
    const yValue = Number(row[yKey])
    const xLabel = String(xValue ?? '')

    let timestamp: string
    if (xKeyFormat === 'date') {
      timestamp = dayjs(xValue).toISOString()
    } else if (
      xKeyFormat === 'number' &&
      typeof xValue === 'number' &&
      isEpochNumericValue(xValue)
    ) {
      timestamp = new Date(xValue).toISOString()
    } else {
      timestamp = dayjs()
        .subtract(rows.length - 1 - index, 'minute')
        .toISOString()
    }

    return {
      timestamp,
      [yKey]: Number.isFinite(yValue) ? yValue : 0,
      _xLabel: xLabel,
    }
  })
}

export function getSqlEditorDateTimeFormat(xKeyFormat: SqlEditorXKeyFormat) {
  if (xKeyFormat === 'date') return 'MMM D, YYYY, hh:mma'
  return 'MMM D, YYYY, hh:mma'
}

export function shouldShowSqlChartXLabel(xKeyFormat: SqlEditorXKeyFormat) {
  return xKeyFormat !== 'date'
}

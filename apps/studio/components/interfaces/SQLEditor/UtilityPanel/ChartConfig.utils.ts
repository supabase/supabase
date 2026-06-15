import dayjs from 'dayjs'

const Y_AXIS_NAME_HINTS = [
  'count',
  'total',
  'sum',
  'avg',
  'average',
  'amount',
  'value',
  'num',
  'size',
  'quantity',
  'rate',
  'percent',
  'percentage',
]

const DATE_NAME_HINTS = ['date', 'time', 'timestamp', 'created', 'updated', 'at']

export function isNumericChartValue(value: unknown): boolean {
  return typeof value === 'number' || (value !== null && value !== '' && !isNaN(Number(value)))
}

export function isDateChartValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false
  if (typeof value === 'number') return false
  if (typeof value === 'boolean') return false

  return dayjs(value as string | Date).isValid()
}

export function isCategoricalChartValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return true
  if (typeof value !== 'string') return false

  return !isNumericChartValue(value) && !isDateChartValue(value)
}

function scoreYAxisKey(key: string): number {
  const normalized = key.toLowerCase()

  if (normalized === 'id' || normalized.endsWith('_id')) return 0

  const hintIndex = Y_AXIS_NAME_HINTS.findIndex((hint) => normalized.includes(hint))
  if (hintIndex >= 0) return Y_AXIS_NAME_HINTS.length - hintIndex + 10

  return 1
}

function scoreXAxisKey(key: string): number {
  const normalized = key.toLowerCase()

  const dateHintIndex = DATE_NAME_HINTS.findIndex((hint) => normalized.includes(hint))
  if (dateHintIndex >= 0) return DATE_NAME_HINTS.length - dateHintIndex + 20

  if (normalized === 'name' || normalized === 'label' || normalized === 'category') return 15

  return 1
}

function getColumnKeys(rows: readonly Record<string, unknown>[]): string[] {
  return Object.keys(rows[0] ?? {})
}

function getNumericKeys(rows: readonly Record<string, unknown>[]): string[] {
  return getColumnKeys(rows).filter((key) => rows.some((row) => isNumericChartValue(row[key])))
}

function getDateKeys(rows: readonly Record<string, unknown>[]): string[] {
  return getColumnKeys(rows).filter((key) => rows.some((row) => isDateChartValue(row[key])))
}

function getCategoricalKeys(rows: readonly Record<string, unknown>[]): string[] {
  return getColumnKeys(rows).filter((key) => rows.some((row) => isCategoricalChartValue(row[key])))
}

export type ChartAxisConfig = {
  xKey: string
  yKey: string
}

export function guessChartAxisKeys(
  rows: readonly Record<string, unknown>[]
): ChartAxisConfig | null {
  if (!rows.length) return null

  const columnKeys = getColumnKeys(rows)
  if (!columnKeys.length) return null

  const numericKeys = getNumericKeys(rows)
  if (!numericKeys.length) return null

  const yKey = [...numericKeys].sort((a, b) => scoreYAxisKey(b) - scoreYAxisKey(a))[0]

  const dateKeys = getDateKeys(rows).filter((key) => key !== yKey)
  const categoricalKeys = getCategoricalKeys(rows).filter((key) => key !== yKey)
  const remainingKeys = columnKeys.filter((key) => key !== yKey)

  const xKey =
    [...dateKeys].sort((a, b) => scoreXAxisKey(b) - scoreXAxisKey(a))[0] ??
    [...categoricalKeys].sort((a, b) => scoreXAxisKey(b) - scoreXAxisKey(a))[0] ??
    remainingKeys.find((key) => !isNumericChartValue(rows[0]?.[key])) ??
    remainingKeys.find((key) => key !== yKey) ??
    null

  if (!xKey || !yKey || xKey === yKey) return null

  return { xKey, yKey }
}

export function shouldAutoConfigureChartAxes(
  rows: readonly Record<string, unknown>[],
  config: ChartAxisConfig
): boolean {
  if (!rows.length) return false

  const columnKeys = getColumnKeys(rows)
  const hasValidConfig =
    Boolean(config.xKey) &&
    Boolean(config.yKey) &&
    columnKeys.includes(config.xKey) &&
    columnKeys.includes(config.yKey)

  return !hasValidConfig
}

export type SqlEditorChartTick = {
  timestamp: string
  [key: string]: string | number
}

export function mapSqlRowsToChartTicks(
  rows: readonly Record<string, unknown>[],
  xKey: string,
  yKey: string
): SqlEditorChartTick[] {
  return rows.map((row, index) => {
    const xValue = row[xKey]
    const yValue = row[yKey]
    const numericY = typeof yValue === 'number' ? yValue : Number(yValue)

    let timestamp: string
    if (isDateChartValue(xValue)) {
      timestamp = dayjs(xValue as string | Date).toISOString()
    } else if (xValue === null || xValue === undefined) {
      timestamp = String(index)
    } else {
      timestamp = String(xValue)
    }

    return {
      timestamp,
      [yKey]: numericY,
    }
  })
}

export function getSqlEditorChartDateTimeFormat(
  xKey: string,
  rows: readonly Record<string, unknown>[]
): string {
  const sample = rows[0]?.[xKey]
  return isDateChartValue(sample) ? 'MMM D YYYY HH:mm' : 'MMM D, YYYY, hh:mma'
}

export function isSqlEditorChartXAxisDate(
  xKey: string,
  rows: readonly Record<string, unknown>[]
): boolean {
  return isDateChartValue(rows[0]?.[xKey])
}

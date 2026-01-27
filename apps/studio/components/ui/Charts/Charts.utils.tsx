import dayjs from 'dayjs'
import { FC, PropsWithChildren, useMemo } from 'react'
import { ResponsiveContainer } from 'recharts'

import { DateTimeFormats } from './Charts.constants'
import type { CommonChartProps, StackedChartProps } from './Charts.types'

/**
 * Auto formats a number to a default precision if it is a float
 *
 * @example
 * numberFormatter(123)       // "123"
 * numberFormatter(123.123)   // "123.12"
 * numberFormatter(123, 2)    // "123.00"
 */
export const numberFormatter = (num: number, precision = 2) => {
  return isFloat(num) ? precisionFormatter(num, precision) : num.toLocaleString()
}

/**
 * Tests if a number is a float.
 *
 * @example
 * isFloat(123)     // false
 * isFloat(123.123)     // true
 */
export const isFloat = (num: number) => String(num).includes('.')

/**
 * Formats a number to a particular precision.
 *
 * @example
 * precisionFormatter(123, 2)       // "123.00"
 * precisionFormatter(123.123, 2)   // "123.12"
 * precisionFormatter(0.00123, 2)   // "<0.01"
 * precisionFormatter(-0.00123, 2)  // ">-0.01"
 */
export const precisionFormatter = (num: number, precision: number): string => {
  if (precision === 0) {
    return String(Math.round(num))
  }

  // Handle small numbers that would display as 0.00
  const threshold = 1 / Math.pow(10, precision)
  if (num > 0 && num < threshold) {
    return `<${threshold.toFixed(precision)}`
  }
  if (num < 0 && num > -threshold) {
    return `>-${threshold.toFixed(precision)}`
  }

  if (isFloat(num)) {
    const [head, tail] = String(num).split('.')
    return Number(head).toLocaleString() + '.' + tail.slice(0, precision)
  } else {
    // pad int with 0
    return num.toLocaleString() + '.' + '0'.repeat(precision)
  }
}

/**
 * Formats a percentage, trimming decimals at 100.
 *
 * @example
 * formatPercentage(100, 2) // "100%"
 * formatPercentage(99.99, 2) // "99.99%"
 */
export const formatPercentage = (value: number, precision = 2) => {
  const isHundred = Math.abs(value - 100) < 1e-6
  if (isHundred) return '100%'
  if (Number.isInteger(value)) return `${value}%`
  const formatted = precisionFormatter(value, precision)
  if (formatted.startsWith('<') || formatted.startsWith('>')) {
    return `${formatted}%`
  }
  if (formatted.includes('.')) {
    const [head, tail = ''] = formatted.split('.')
    return `${head}.${tail.padEnd(precision, '0')}%`
  }
  return `${formatted}%`
}

/**
 * Formats a timestamp.
 * Optionally formats the string to UTC
 * @param value
 * @param format
 * @param utc
 * @returns
 */
export const timestampFormatter = (
  value: string,
  format: string = DateTimeFormats.FULL,
  utc: boolean = false
) => {
  if (utc) {
    return dayjs.utc(value).format(format)
  }
  return dayjs(value).format(format)
}

/**
 * Hook to create common wrapping components, perform data transformations
 * returns a Container component and the minHeight set
 */
export const useChartSize = (
  size: CommonChartProps<any>['size'] = 'normal',
  sizeMap: {
    tiny: number
    small: number
    normal: number
    large: number
  } = {
    tiny: 76,
    small: 96,
    normal: 160,
    large: 280,
  }
) => {
  const minHeight = sizeMap[size]
  const Container: FC<PropsWithChildren & { className?: string }> = useMemo(
    () =>
      ({ className, children }) => (
        <ResponsiveContainer
          className={className}
          height={minHeight}
          minHeight={minHeight}
          width="100%"
        >
          {children as JSX.Element}
        </ResponsiveContainer>
      ),
    [size]
  )
  return {
    Container,
    minHeight,
  }
}

/**
 * Transforms data points into a stacked data structure that can be consumed by recharts
 */
export const useStacked = ({
  data,
  xAxisKey,
  yAxisKey,
  stackKey,
  variant = 'values',
}: Pick<StackedChartProps<any>, 'xAxisKey' | 'yAxisKey' | 'stackKey'> & {
  variant?: 'values' | 'percentages'
} & Pick<CommonChartProps<Record<string, number>>, 'data'>) => {
  const stackedData = useMemo(() => {
    if (!data) return []
    const mapping = data.reduce(
      (acc, datum) => {
        const x = datum[xAxisKey]
        const y = datum[yAxisKey]
        const s = datum[stackKey]
        if (!acc[x]) {
          acc[x] = {}
        }

        acc[x][s] = y
        return acc
      },
      {} as Record<string, Record<string, number>>
    )

    const flattened = Object.entries(mapping).map(([x, sMap]) => ({
      ...sMap,
      [xAxisKey]: Number.isNaN(Number(x)) ? x : Number(x),
    }))
    return flattened
  }, [JSON.stringify(data)])
  const dataKeys = useMemo(() => {
    return Object.keys(stackedData[0] || {})
      .filter((k) => k !== xAxisKey && k !== yAxisKey)
      .sort()
  }, [JSON.stringify(stackedData[0] || {})])

  const percentagesStackedData = useMemo(() => {
    if (variant !== 'percentages') return

    return stackedData.map((stack) => {
      const entries = Object.entries(stack) as Array<[string, number]>
      let map
      const sum = entries
        .filter(([key, _value]) => dataKeys.includes(key))
        .reduce((acc, [_key, value]) => acc + value, 0)
      map = entries.reduce((acc, [key, value]) => {
        if (!dataKeys.includes(key)) {
          return { ...acc, [key]: value }
        }
        return { ...acc, [key]: value !== 0 ? value / sum : 0 }
      }, {} as any)
      return map
    })
  }, [JSON.stringify(stackedData)])

  return { dataKeys, stackedData, percentagesStackedData }
}

import { DATETIME_FORMAT } from 'components/interfaces/Reports/Reports.constants'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { ResponsiveContainer } from 'recharts'
import { DateTimeFormats } from './Charts.constants'
import { CommonChartProps, StackedChartProps } from './Charts.types'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

/**
 * Auto formats a number to a default precision if it is a float
 *
 * @example
 * numberFormatter(123)       // "123"
 * numberFormatter(123.123)   // "123.12"
 * numberFormatter(123, 2)    // "123.00"
 */
export const numberFormatter = (num: number, precision = 2) =>
  isFloat(num) ? precisionFormatter(num, precision) : String(num)

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
 */
export const precisionFormatter = (num: number, precision: number): string => {
  if (isFloat(num)) {
    const [head, tail] = String(num).split('.')
    return head + '.' + tail.slice(0, precision)
  } else {
    // pad int with 0
    return String(num) + '.' + '0'.repeat(precision)
  }
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
  const Container: React.FC<React.PropsWithChildren> = useMemo(
    () =>
      ({ children }) =>
        (
          <ResponsiveContainer height={minHeight} minHeight={minHeight} width="100%">
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
    const mapping = data.reduce((acc, datum) => {
      const x = datum[xAxisKey]
      const y = datum[yAxisKey]
      const s = datum[stackKey]
      if (!acc[x]) {
        acc[x] = {}
      }

      acc[x][s] = y
      return acc
    }, {} as Record<string, Record<string, number>>)

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

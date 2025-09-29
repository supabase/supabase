import { AnalyticsInterval } from 'data/analytics/constants'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { get } from 'data/fetchers'

export type Granularity = 'minute' | 'hour' | 'day'
export function analyticsIntervalToGranularity(interval: AnalyticsInterval): Granularity {
  switch (interval) {
    case '1m':
      return 'minute'
    case '5m':
      return 'minute'
    case '10m':
      return 'minute'
    case '30m':
      return 'minute'
    case '1h':
      return 'hour'
    case '1d':
      return 'day'
    default:
      return 'hour'
  }
}

export const REPORT_STATUS_CODE_COLORS: { [key: string]: { light: string; dark: string } } = {
  '400': { light: '#FFD54F', dark: '#FFF176' },
  '401': { light: '#FF8A65', dark: '#FFAB91' },
  '403': { light: '#FFB74D', dark: '#FFCC80' },
  '404': { light: '#90A4AE', dark: '#B0BEC5' },
  '409': { light: '#BA68C8', dark: '#CE93D8' },
  '410': { light: '#A1887F', dark: '#BCAAA4' },
  '422': { light: '#FF9800', dark: '#FFB74D' },
  '429': { light: '#E65100', dark: '#F57C00' },
  '500': { light: '#B71C1C', dark: '#D32F2F' },
  '502': { light: '#9575CD', dark: '#B39DDB' },
  '503': { light: '#0097A7', dark: '#4DD0E1' },
  '504': { light: '#C0CA33', dark: '#D4E157' },
  default: { light: '#757575', dark: '#9E9E9E' },
}

export const useEdgeFnIdToName = ({ projectRef }: { projectRef: string }) => {
  const { data: edgeFunctions, isLoading } = useEdgeFunctionsQuery({
    projectRef,
  })

  function edgeFnIdToName(id: string) {
    return edgeFunctions?.find((fn) => fn.id === id)?.name
  }

  return {
    edgeFnIdToName,
    isLoading,
  }
}

export async function fetchLogs(
  projectRef: string,
  sql: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: {
      path: { ref: projectRef },
      query: {
        sql,
        iso_timestamp_start: startDate,
        iso_timestamp_end: endDate,
      },
    },
  })
  if (error) throw error
  return data
}

export const STATUS_CODE_COLORS: { [key: string]: { light: string; dark: string } } = {
  '400': { light: '#FFD54F', dark: '#FFF176' },
  '401': { light: '#FF8A65', dark: '#FFAB91' },
  '403': { light: '#FFB74D', dark: '#FFCC80' },
  '404': { light: '#90A4AE', dark: '#B0BEC5' },
  '409': { light: '#BA68C8', dark: '#CE93D8' },
  '410': { light: '#A1887F', dark: '#BCAAA4' },
  '422': { light: '#FF9800', dark: '#FFB74D' },
  '429': { light: '#E65100', dark: '#F57C00' },
  '500': { light: '#B71C1C', dark: '#D32F2F' },
  '502': { light: '#9575CD', dark: '#B39DDB' },
  '503': { light: '#0097A7', dark: '#4DD0E1' },
  '504': { light: '#C0CA33', dark: '#D4E157' },
  default: { light: '#757575', dark: '#9E9E9E' },
}

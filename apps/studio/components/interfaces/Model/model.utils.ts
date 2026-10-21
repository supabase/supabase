import type { ChartLineTick } from 'ui-patterns/Chart'

import type {
  InfraMonitoringAttribute,
  InfraMonitoringMultiData,
} from '@/data/analytics/infra-monitoring-query'

export function getModelSeries(
  response: InfraMonitoringMultiData,
  attribute: InfraMonitoringAttribute,
  start: string,
  end: string
): ChartLineTick[] {
  const minimum = Date.parse(start)
  const maximum = Date.parse(end)
  return response.data
    .map((point, index) => {
      const rawValue =
        'series' in response
          ? response.data[index].values[attribute]
          : response.data[index][attribute]
      const number = typeof rawValue === 'string' && rawValue.trim() !== '' ? Number(rawValue) : NaN
      const sample: ChartLineTick = { time: Date.parse(point.period_start) }
      if (Number.isFinite(number)) sample.value = number
      return sample
    })
    .filter(
      ({ time }) =>
        typeof time === 'number' && Number.isFinite(time) && time >= minimum && time <= maximum
    )
    .sort((left, right) => Number(left.time) - Number(right.time))
}

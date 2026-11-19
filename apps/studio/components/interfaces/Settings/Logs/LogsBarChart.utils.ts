import dayjs from 'dayjs'

export const calculateBarClickTimeRange = (
  currentRangeStart: string,
  currentRangeEnd: string | undefined,
  clickedTimestamp: string
) => {
  const datumTimestamp = dayjs(clickedTimestamp).toISOString()
  const endTime = currentRangeEnd ? dayjs(currentRangeEnd) : dayjs()
  const currentRangeDuration = endTime.diff(dayjs(currentRangeStart), 'hour', true)

  let rangeOffset: number
  let rangeUnit: dayjs.ManipulateType

  if (currentRangeDuration >= 12) {
    rangeOffset = 0.5
    rangeUnit = 'hour'
  } else if (currentRangeDuration >= 1) {
    rangeOffset = 2.5
    rangeUnit = 'minute'
  } else if (currentRangeDuration >= 1 / 30) {
    rangeOffset = 1
    rangeUnit = 'minute'
  } else {
    rangeOffset = 7.5
    rangeUnit = 'second'
  }

  return {
    start: dayjs(datumTimestamp).subtract(rangeOffset, rangeUnit).toISOString(),
    end: dayjs(datumTimestamp).add(rangeOffset, rangeUnit).toISOString(),
  }
}

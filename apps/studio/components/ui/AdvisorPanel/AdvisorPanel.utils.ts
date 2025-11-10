import dayjs from 'dayjs'

export const formatItemDate = (timestamp: number): string => {
  const insertedAt = timestamp
  const daysFromNow = dayjs().diff(dayjs(insertedAt), 'day')
  const formattedTimeFromNow = dayjs(insertedAt).fromNow()
  const formattedInsertedAt = dayjs(insertedAt).format('MMM DD, YYYY')
  return daysFromNow > 1 ? formattedInsertedAt : formattedTimeFromNow
}


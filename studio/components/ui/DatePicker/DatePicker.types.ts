export type Time = {
  HH: string
  mm: string
  ss: string
}

export type TimeType = 'HH' | 'mm' | 'ss'

export interface TimeSplitInputProps {
  time: Time
  setTime: (x: Time) => void
  type: 'start' | 'end'
  setStartTime: (x: Time) => void
  setEndTime: (x: Time) => void
  startTime: Time
  endTime: Time
  startDate: any
  endDate: any
}

export type Date = {
  YYYY: string
  MM: string
  DD: string
}

export type DateType = 'YYYY' | 'MM' | 'DD'

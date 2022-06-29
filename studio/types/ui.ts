export interface Notification {
  category: 'info' | 'error' | 'success' | 'loading'
  message: string // Readable message for users to understand
  id?: string
  error?: any // Optional: Any other errors that needs to be logged out in the console
  progress?: number // Optional: For loading messages to show a progress bar (Out of 100)
  duration?: number // Optional: How long to show the message for (ms)
}

export interface ChartIntervals {
  key: 'minutely' | 'hourly' | 'daily' | '5min' | '15min' | '1hr' | '1day' | '7day'
  label: string
  startValue: 1 | 24 | 7
  startUnit: 'hour' | 'day'
  format: 'MMM D, h:mma' | 'MMM D, ha' | 'MMM D'
}

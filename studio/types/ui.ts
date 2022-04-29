export interface Notification {
  category: 'info' | 'error' | 'success' | 'loading'
  message: string // Readable message for users to understand
  id?: string
  error?: any // Optional: Any other errors that needs to be logged out in the console
  progress?: number // Optional: For loading messages to show a progress bar (Out of 100)
  duration?: number // Optional: How long to show the message for (ms)
}

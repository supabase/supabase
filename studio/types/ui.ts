export interface Notification {
  id?: string
  category: 'info' | 'error' | 'success' | 'loading'
  message: string // Readable message for users to understand
  error?: any // Any other errors that needs to be logged out in the console
}

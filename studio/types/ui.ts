export interface Notification {
  id?: string
  category: 'info' | 'error' | 'success' | 'loading'
  message: string
}

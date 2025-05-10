export function getStatusColor(value?: number | string): Record<'text' | 'bg' | 'border', string> {
  switch (value) {
    case '1':
    case 'info':
      return {
        text: 'text-blue-500',
        bg: '',
        border: 'border-blue-200 dark:border-blue-800',
      }
    case '2':
    case 'success':
      return {
        text: 'text-foreground-lighter',
        bg: '',
        border: 'border-green-200 dark:border-green-800',
      }
    case '4':
    case 'warning':
    case 'redirect':
      return {
        text: 'text-warning-600 dark:text-warning',
        bg: 'bg-warning-300 dark:bg-waning-200',
        border: 'border border-warning-400/50 dark:border-warning-400/50',
      }
    case '5':
    case 'error':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive-300 dark:bg-destructive-300/50',
        border: 'border border-destructive-400/50 dark:border-destructive-400/50',
      }
    default:
      return {
        text: 'text-foreground-lighter',
        bg: '',
        border: '',
      }
  }
}

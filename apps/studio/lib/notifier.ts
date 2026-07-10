/**
 * A minimal dependency-injection contract for surfacing user-facing
 * notifications (toasts). It is structurally a subset of sonner's `toast`, so
 * the real `toast` can be passed directly while tests pass a spy — letting
 * modules that need to notify stay free of a hard sonner import.
 */
export interface Notifier {
  success: (message: string) => void
  error: (message: string) => void
}

import { AlertError } from '@/components/ui/AlertError'

type ApiKeysAccessNoteProps = {
  /** Result of `useGrant` for the api-keys endpoint. Renders nothing unless it is denied or errored. */
  grant: { status: 'loading' | 'granted' | 'denied' | 'error'; error?: { message: string } }
  /** What the user can do instead, appended to the shared message. */
  fallback?: string
  /** Spacing for the wrapper, which is only rendered when there is something to show. */
  className?: string
}

/**
 * Inline note for widgets that prefill or offer API keys, shown when the user can't read them.
 * Keeps the rest of the widget usable.
 */
export const ApiKeysAccessNote = ({ grant, fallback, className }: ApiKeysAccessNoteProps) => {
  if (grant.status === 'denied') {
    return (
      <div className={className}>
        <p className="text-xs text-foreground-lighter">
          You need additional permissions to view API keys.
          {fallback ? ` ${fallback}` : ''}
        </p>
      </div>
    )
  }
  if (grant.status === 'error') {
    return (
      <div className={className}>
        <AlertError error={grant.error} subject="Failed to check API key permissions" />
      </div>
    )
  }
  return null
}

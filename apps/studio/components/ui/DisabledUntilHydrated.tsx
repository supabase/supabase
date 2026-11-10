import { useHydrated } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'

/**
 * Disables the form controls inside server-rendered HTML until React hydrates, so input typed
 * before then isn't lost and Enter can't natively submit a form that has no handler yet.
 */
export const DisabledUntilHydrated = ({ children }: PropsWithChildren) => {
  const isHydrated = useHydrated()

  return (
    <fieldset disabled={!isHydrated} className="contents">
      {children}
    </fieldset>
  )
}

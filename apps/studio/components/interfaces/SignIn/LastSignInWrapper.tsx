import { ReactNode, useEffect, useState } from 'react'
import { Badge, cn } from 'ui'

import { LastSignInType, useLastSignIn } from '@/hooks/misc/useLastSignIn'

export function LastSignInWrapper({
  children,
  type,
}: {
  children: ReactNode
  type: LastSignInType
}) {
  const [lastSignIn] = useLastSignIn()

  // `useLastSignIn` reads localStorage, which is empty on the server but populated on the first
  // client render — rendering the badge based on it directly would trip a hydration mismatch. Gate
  // on mount so the server and first client render agree (no badge), then reveal it once mounted.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isLastUsed = mounted && lastSignIn === type

  return (
    <div className="flex items-center relative">
      {isLastUsed && (
        <Badge
          variant="success"
          className="absolute -right-4 -top-3 shadow-sm z-10 bg-brand-400 text-foreground pointer-events-none"
        >
          Last used
        </Badge>
      )}
      <div
        className={cn('w-full', {
          'outline outline-1 outline-offset-4 outline-foreground-lighter/50 rounded-md': isLastUsed,
        })}
      >
        {children}
      </div>
    </div>
  )
}

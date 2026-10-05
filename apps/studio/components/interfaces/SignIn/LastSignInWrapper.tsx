import { ReactNode, useEffect, useState } from 'react'
import { Badge, cn, FloatingPlate } from 'ui'

import { LastSignInType, useLastSignIn } from '@/hooks/misc/useLastSignIn'

// Sign-in controls wrapped here all use Button size="large". Outline sits
// outline-offset-4 outside that control, so add 4px to the large control radius
// to keep the ring concentric with the button corners.
const LAST_USED_OUTLINE_RADIUS = 'rounded-[calc(var(--radius-md)*(1+(42/26-1)*0.35)+4px)]'

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
        <FloatingPlate
          rounded="full"
          className="absolute -right-4 -top-3 z-10 shadow-sm pointer-events-none"
        >
          <Badge variant="success">Last used</Badge>
        </FloatingPlate>
      )}
      <div
        className={cn(
          'w-full',
          isLastUsed &&
            cn(
              'outline outline-1 outline-offset-4 outline-foreground-lighter/50',
              LAST_USED_OUTLINE_RADIUS
            )
        )}
      >
        {children}
      </div>
    </div>
  )
}

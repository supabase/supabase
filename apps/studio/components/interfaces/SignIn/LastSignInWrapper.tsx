import { LastSignInType, useLastSignIn } from 'hooks/misc/useLastSignIn'
import { ReactNode } from 'react'

import { Badge, cn } from 'ui'

export function LastSignInWrapper({
  children,
  type,
}: {
  children: ReactNode
  type: LastSignInType
}) {
  const [lastSignIn] = useLastSignIn()

  return (
    <div className="flex items-center relative">
      {lastSignIn === type && (
        <Badge
          variant="brand"
          className="absolute -right-4 -top-3 rounded-full px-2 py-0.5 shadow z-10 bg-brand-400 bg-opacity-100 text-foreground pointer-events-none"
        >
          Last used
        </Badge>
      )}
      <div
        className={cn('w-full', {
          'outline outline-1 outline-offset-4 outline-foreground-lighter/50 rounded-md ':
            lastSignIn === type,
        })}
      >
        {children}
      </div>
    </div>
  )
}

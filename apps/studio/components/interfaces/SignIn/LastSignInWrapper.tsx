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
        <Badge variant="brand" className="absolute -right-[84px]">
          Last used
        </Badge>
      )}
      <div
        className={cn('w-full', {
          'outline outline-1 outline-offset-4 outline-foreground-lighter rounded-md ':
            lastSignIn === type,
        })}
      >
        {children}
      </div>
    </div>
  )
}

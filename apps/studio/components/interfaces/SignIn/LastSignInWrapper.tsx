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
    <div>
      <div className="relative flex items-center">
        {children}
        {lastSignIn === type && (
          <Badge variant="brand" className="absolute -right-[84px]">
            Last used
          </Badge>
        )}
      </div>
    </div>
  )
}

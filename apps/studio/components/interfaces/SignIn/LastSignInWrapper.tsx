import { LastSignInType, useLastSignIn } from 'hooks/misc/useLastSignIn'
import { ReactNode } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

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
        <Tooltip>
          <TooltipTrigger asChild className="absolute -right-8">
            <div className="p-2 flex">
              <span className="w-2.5 h-2.5 bg-brand rounded-full animate-pulse" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Last used</TooltipContent>
        </Tooltip>
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

import { LastSignInType, useLastSignIn } from 'hooks/misc/useLastSignIn'
import { ReactNode } from 'react'
import { cn } from 'ui'

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
      {lastSignIn === type && (
        <div className="text-brand-500 dark:text-brand px-2 font-mono text-xs tracking-tight">
          Last used
        </div>
      )}
      <div
        className={cn({
          'outline outline-1 mt-2 outline-offset-4 outline-brand rounded-md': lastSignIn === type,
        })}
      >
        {children}
      </div>
    </div>
  )
}

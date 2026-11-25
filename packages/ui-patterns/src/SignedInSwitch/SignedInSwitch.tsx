'use client'

import { useIsLoggedIn, useIsUserLoading } from 'common/auth'
import type { ReactNode } from 'react'

export interface SignedInSwitchProps {
  signedIn: ReactNode
  signedOut: ReactNode
}

// auth loads after hydration, so the first-paint hint in the page picks the branch until then
// both branches stay mounted, so focus stays on its link when auth settles
export const SignedInSwitch = ({ signedIn, signedOut }: SignedInSwitchProps) => {
  const isLoggedIn = useIsLoggedIn()
  const isUserLoading = useIsUserLoading()

  return (
    <>
      <div
        hidden={!isUserLoading && isLoggedIn}
        className={isUserLoading ? 'contents in-data-signed-in:hidden' : 'contents'}
      >
        {signedOut}
      </div>
      <div
        hidden={!isUserLoading && !isLoggedIn}
        className={isUserLoading ? 'hidden in-data-signed-in:contents' : 'contents'}
      >
        {signedIn}
      </div>
    </>
  )
}

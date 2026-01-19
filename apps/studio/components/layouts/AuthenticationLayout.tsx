import { PropsWithChildren } from 'react'

import { AppBannerWrapper } from 'components/interfaces/App/AppBannerWrapper'

export const AuthenticationLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="flex flex-col min-h-screen w-screen">
      <AppBannerWrapper />
      <div className="flex flex-1 w-full overflow-y-hidden">
        <div className="flex-grow h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

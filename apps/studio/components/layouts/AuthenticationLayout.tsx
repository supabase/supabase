import { PropsWithChildren } from 'react'

import { AppBannerWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'

export const AuthenticationLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <AppBannerContextProvider>
      <div className="flex flex-col min-h-screen w-screen">
        <AppBannerWrapper />
        <div className="flex flex-1 w-full overflow-y-hidden">
          <div className="flex-grow h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </AppBannerContextProvider>
  )
}

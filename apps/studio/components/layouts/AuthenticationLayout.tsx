import { AppBannerWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { PropsWithChildren } from 'react'

const AuthenticationLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <>
      <AppBannerContextProvider>
        <div className="flex flex-col h-screen w-screen">
          {/* Top Banner */}
          <AppBannerWrapper />
          {/* Main Content Area */}
          <div className="flex flex-1 w-full overflow-y-hidden">
            {/* Main Content */}
            <div className="flex-grow h-full overflow-y-auto">{children}</div>
          </div>
        </div>
      </AppBannerContextProvider>
    </>
  )
}

export default AuthenticationLayout

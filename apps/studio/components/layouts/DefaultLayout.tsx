import { IS_PLATFORM } from 'lib/constants'
import { PropsWithChildren } from 'react'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import { AppDefaultNavigation } from 'components/interfaces/app-default-navigation'

export interface DefaultLayoutProps {
  title?: string
  product?: string
  selectedTable?: string
}

const DefaultLayout = ({ children }: PropsWithChildren<DefaultLayoutProps>) => {
  return (
    <>
      <div className="flex flex-col h-screen w-screen">
        {/* {IS_PLATFORM && <LayoutHeader />} */}
        <div className="flex h-full w-full flex-row grow overflow-y-auto">
          <AppDefaultNavigation />
          <div className="py-1.5 flex-grow">{children}</div>
        </div>
      </div>
    </>
  )
}

export default DefaultLayout

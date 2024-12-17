import { IS_PLATFORM } from 'lib/constants'
import { PropsWithChildren } from 'react'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'

export interface DefaultLayoutProps {
  title?: string
  product?: string
  selectedTable?: string
}

const DefaultLayout = ({ children }: PropsWithChildren<DefaultLayoutProps>) => {
  return (
    <>
      <div className="flex flex-col h-screen w-screen">
        {IS_PLATFORM && <LayoutHeader />}
        <div className="flex h-full flex-row grow overflow-y-auto">{children}</div>
      </div>
    </>
  )
}

export default DefaultLayout

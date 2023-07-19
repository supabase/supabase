import { PropsWithChildren } from 'react'
import AppLayout from '../AppLayout/AppLayout'
import { useParams } from 'common'
import OrganizationSettingsMenu from './OrganizationSettingsMenu'
import AccountSettingsMenu from './AccountSettingsMenu'

const SettingsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { slug } = useParams()

  // [Joshen] Note to self - these could contribute to a Scaffold component

  return (
    <AppLayout>
      <div className="flex h-full">
        <div className="h-full overflow-y-auto min-w-[280px] border-r px-8 py-8">
          {slug !== undefined ? <OrganizationSettingsMenu /> : <AccountSettingsMenu />}
        </div>
        <div className="h-full overflow-y-auto flex-grow">{children}</div>
      </div>
    </AppLayout>
  )
}

export default SettingsLayout

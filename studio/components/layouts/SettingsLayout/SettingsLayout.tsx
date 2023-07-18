import { PropsWithChildren } from 'react'
import AppLayout from '../AppLayout/AppLayout'
import { useParams } from 'common'
import OrganizationSettingsMenu from './OrganizationSettingsMenu'
import AccountSettingsMenu from './AccountSettingsMenu'

const SettingsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { slug } = useParams()

  return (
    <AppLayout>
      <div className="flex h-full">
        <div className="w-[280px] border-r h-full px-8 py-8">
          {slug !== undefined ? <OrganizationSettingsMenu /> : <AccountSettingsMenu />}
        </div>
        <div className="flex-grow">{children}</div>
      </div>
    </AppLayout>
  )
}

export default SettingsLayout

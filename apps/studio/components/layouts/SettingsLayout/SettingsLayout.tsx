import { PropsWithChildren } from 'react'
import AppLayout from '../AppLayout/AppLayout'
import { useParams } from 'common'
import OrganizationSettingsMenu from './OrganizationSettingsMenu'
import AccountSettingsMenu from './AccountSettingsMenu'
import { useRouter } from 'next/router'

const SettingsLayout = ({ children }: PropsWithChildren<{}>) => {
  const router = useRouter()
  const { ref, slug } = useParams()

  return (
    <AppLayout>
      <div className="flex h-full">
        {router.pathname !== '/projects' && (
          <div className="h-full overflow-y-auto min-w-[280px] border-r px-8 py-8">
            {slug === undefined && ref === undefined ? (
              <AccountSettingsMenu />
            ) : (
              <OrganizationSettingsMenu />
            )}
          </div>
        )}
        <div className="h-full overflow-y-auto flex-grow">{children}</div>
      </div>
    </AppLayout>
  )
}

export default SettingsLayout

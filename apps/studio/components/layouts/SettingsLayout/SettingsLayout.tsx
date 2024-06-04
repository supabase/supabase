import { useParams } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import AppLayout from '../AppLayout/AppLayout'
import AccountSettingsMenu from './AccountSettingsMenu'
import OrganizationSettingsMenu from './OrganizationSettingsMenu'

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

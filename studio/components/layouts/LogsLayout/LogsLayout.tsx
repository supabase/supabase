import { FC, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { checkPermissions, useStore, withAuth } from 'hooks'
import BaseLayout from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import { generateLogsMenu } from './LogsMenu.utils'
import ProductMenu from 'components/ui/ProductMenu'

interface Props {
  subtitle?: ReactNode
  children?: ReactNode
}

const LogsLayout: FC<Props> = ({ subtitle, children }) => {
  const { ui } = useStore()
  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const project = ui.selectedProject

  const canUseLogsExplorer = checkPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  if (!canUseLogsExplorer) {
    return (
      <BaseLayout>
        <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
          <NoPermission isFullPage resourceText="access your project's logs explorer" />
        </main>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout
      product="Logs"
      productMenu={<ProductMenu page={page} menu={generateLogsMenu(project)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </BaseLayout>
  )
}

export default withAuth(observer(LogsLayout))

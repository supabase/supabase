import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import ProductMenu from 'components/ui/ProductMenu'
import { useSelectedProject, useStore, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateDatabaseMenu } from './DatabaseMenu.utils'

export interface DatabaseLayoutProps {
  title?: string
}

const DatabaseLayout = ({ children }: PropsWithChildren<DatabaseLayoutProps>) => {
  const { ui, meta, vault } = useStore()
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null
  const pgNetExtensionExists = meta.extensions.byId('pg_net') !== undefined

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.roles.load()
      meta.triggers.load()
      meta.extensions.load()
      meta.publications.load()
    }
  }, [ui.selectedProjectRef])

  useEffect(() => {
    if (isVaultEnabled) {
      vault.load()
    }
  }, [ui.selectedProjectRef, isVaultEnabled])

  return (
    <ProjectLayout
      product="Database"
      productMenu={
        <ProductMenu page={page} menu={generateDatabaseMenu(project, { pgNetExtensionExists })} />
      }
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(observer(DatabaseLayout))

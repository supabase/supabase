import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'

import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import { useSelectedProject, useStore, withAuth } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import ProjectLayout from '../'
import { generateDatabaseMenu } from './DatabaseMenu.utils'

export interface DatabaseLayoutProps {
  title?: string
}

const DatabaseLayout = ({ children }: PropsWithChildren<DatabaseLayoutProps>) => {
  const { ui, meta, vault, backups } = useStore()
  const { isLoading: isSchemasLoading } = meta.schemas
  const { isLoading: isVaultLoading } = vault

  const { isInitialized, error } = meta.tables
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null
  const pgNetExtensionExists = meta.extensions.byId('pg_net') !== undefined

  const isLoading = isSchemasLoading || (isVaultEnabled && isVaultLoading)
  const [loaded, setLoaded] = useState<boolean>(isInitialized)

  useEffect(() => {
    if (ui.selectedProjectRef) {
      // Eventually should only load the required stores based on the pages
      meta.schemas.load()
      meta.tables.load()

      meta.roles.load()
      meta.triggers.load()
      meta.extensions.load()
      meta.publications.load()

      if (IS_PLATFORM) {
        backups.load()
      }
    }
  }, [ui.selectedProjectRef])

  useEffect(() => {
    if (isVaultEnabled) {
      vault.load()
    }
  }, [ui.selectedProjectRef, isVaultEnabled])

  // Optimization required: load logic should be at the page level
  // e.g backups page is waiting for meta.tables to load finish when it doesnt even need that data
  useEffect(() => {
    if (!isLoading && !loaded) {
      setLoaded(true)
    }
  }, [isLoading])

  if (error) {
    return (
      <ProjectLayout>
        <Error error={error} />
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout
      isLoading={!loaded}
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

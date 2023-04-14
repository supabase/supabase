import { FC, ReactNode, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import ProjectLayout from '../'
import { useStore, withAuth } from 'hooks'
import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import { generateDatabaseMenu } from './DatabaseMenu.utils'
import { IS_PLATFORM } from 'lib/constants'

interface Props {
  title?: string
  children: ReactNode
}

const DatabaseLayout: FC<Props> = ({ title, children }) => {
  const { meta, ui, vault, backups } = useStore()
  const { isLoading } = meta.schemas
  const { isInitialized, error } = meta.tables
  const project = ui.selectedProject

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  const [loaded, setLoaded] = useState<boolean>(isInitialized)

  useEffect(() => {
    if (ui.selectedProject?.ref) {
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
  }, [ui.selectedProject?.ref])

  useEffect(() => {
    if (isVaultEnabled) {
      vault.load()
    }
  }, [ui.selectedProject?.ref, isVaultEnabled])

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
      productMenu={<ProductMenu page={page} menu={generateDatabaseMenu(project)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(observer(DatabaseLayout))

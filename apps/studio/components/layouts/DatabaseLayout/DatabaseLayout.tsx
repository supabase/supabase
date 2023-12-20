import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import ProductMenu from 'components/ui/ProductMenu'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProject, useStore, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateDatabaseMenu } from './DatabaseMenu.utils'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'

export interface DatabaseLayoutProps {
  title?: string
}

const DatabaseLayout = ({ children }: PropsWithChildren<DatabaseLayoutProps>) => {
  const { ui, vault } = useStore()
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: addons } = useProjectAddonsQuery({ projectRef: project?.ref })

  const vaultExtension = (data ?? []).find((ext) => ext.name === 'supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null
  const pgNetExtensionExists = (data ?? []).find((ext) => ext.name === 'pg_net') !== undefined
  const pitrEnabled = addons?.selected_addons.find((addon) => addon.type === 'pitr') !== undefined

  useEffect(() => {
    if (isVaultEnabled) {
      vault.load()
    }
  }, [ui.selectedProjectRef, isVaultEnabled])

  return (
    <ProjectLayout
      product="Database"
      productMenu={
        <ProductMenu
          page={page}
          menu={generateDatabaseMenu(project, { pgNetExtensionExists, pitrEnabled })}
        />
      }
      isBlocking={false}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(observer(DatabaseLayout))

import { FC, ReactNode, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { useStore } from 'hooks'
import BaseLayout from '../'
import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import { generateDatabaseMenu } from './DatabaseMenu.utils'

interface Props {
  title?: string
  children: ReactNode
}

const DatabaseLayout: FC<Props> = ({ title, children }) => {
  const { meta, ui } = useStore()
  const { isInitialized, isLoading, error } = meta.tables
  const project = ui.selectedProject

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const [loaded, setLoaded] = useState<boolean>(isInitialized)

  useEffect(() => {
    if (ui.selectedProject) {
      // Eventually should only load the required stores based on the pages
      meta.schemas.load()
      meta.tables.load()

      meta.roles.load()
      meta.triggers.load()
      meta.extensions.load()
      meta.publications.load()
    }
  }, [ui.selectedProject])

  useEffect(() => {
    if (!isLoading && !loaded) {
      setLoaded(true)
    }
  }, [isLoading])

  if (error) {
    return (
      <BaseLayout>
        <Error error={error} />
      </BaseLayout>
    )
  }

  return (
    <BaseLayout
      isLoading={!loaded}
      product="Database"
      productMenu={<ProductMenu page={page} menu={generateDatabaseMenu(project)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </BaseLayout>
  )
}

export default observer(DatabaseLayout)

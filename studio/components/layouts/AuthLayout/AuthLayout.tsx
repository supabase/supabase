import { FC, ReactNode, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { useStore, withAuth } from 'hooks'

import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import { generateAuthMenu } from './AuthLayout.utils'
import { ProjectLayoutNonBlocking } from '../ProjectLayout/ProjectLayout'

interface Props {
  title?: string
  children: ReactNode
}

const AuthLayout: FC<Props> = ({ title, children }) => {
  const { ui, meta } = useStore()
  const { isInitialized, isLoading, error } = meta.tables
  const projectRef = ui.selectedProject?.ref ?? 'default'

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const [loaded, setLoaded] = useState<boolean>(isInitialized)

  useEffect(() => {
    if (ui.selectedProject) {
      meta.policies.load()
      meta.tables.load()
      meta.roles.load()
    }
  }, [ui.selectedProject])

  useEffect(() => {
    if (!isLoading && !loaded) {
      setLoaded(true)
    }
  }, [isLoading])

  if (error) {
    return (
      <ProjectLayoutNonBlocking>
        <Error error={error} />
      </ProjectLayoutNonBlocking>
    )
  }

  return (
    <ProjectLayoutNonBlocking
      isLoading={!loaded}
      title={title || 'Authentication'}
      product="Authentication"
      productMenu={<ProductMenu page={page} menu={generateAuthMenu(projectRef)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayoutNonBlocking>
  )
}

export default withAuth(observer(AuthLayout))

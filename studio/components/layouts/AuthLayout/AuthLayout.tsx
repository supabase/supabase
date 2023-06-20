import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { FC, ReactNode, useEffect, useState } from 'react'

import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import { useSelectedProject, useStore, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateAuthMenu } from './AuthLayout.utils'

interface Props {
  title?: string
  children: ReactNode
}

const AuthLayout: FC<Props> = ({ title, children }) => {
  const { meta } = useStore()
  const { isInitialized, isLoading, error } = meta.tables
  const selectedProject = useSelectedProject()
  const projectRef = selectedProject?.ref ?? 'default'

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const [loaded, setLoaded] = useState<boolean>(isInitialized)

  useEffect(() => {
    if (selectedProject?.ref) {
      meta.policies.load()
      meta.tables.load()
      meta.roles.load()
      meta.schemas.load()
    }
  }, [selectedProject?.ref])

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
      title={title || 'Authentication'}
      product="Authentication"
      productMenu={<ProductMenu page={page} menu={generateAuthMenu(projectRef)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(observer(AuthLayout))

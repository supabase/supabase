import * as React from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { useStore, withAuth } from 'hooks'

import BaseLayout from 'components/layouts'

type ProjectBuildingPageState = {} & any
const ProjectBuildingPage: React.FC<ProjectBuildingPageState> = () => {
  const { ui } = useStore()
  const project: any = ui.selectedProject
  return (
    <BaseLayout title="Project Building">
      <RedirectToDashboard projectRef={project?.ref ?? ''} />
    </BaseLayout>
  )
}
export default withAuth(observer(ProjectBuildingPage))

type RedirectToDashboardState = {
  projectRef: string
}
const RedirectToDashboard: React.FC<RedirectToDashboardState> = ({ projectRef }) => {
  const router = useRouter()

  React.useEffect(() => {
    router.push(`/project/${projectRef}`)
  }, [])
  return null
}

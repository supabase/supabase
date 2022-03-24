import * as React from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { useStore, withAuth } from 'hooks'

import ProjectLayout from 'components/layouts'

type ProjectBuildingPageState = {} & any
const ProjectBuildingPage: React.FC<ProjectBuildingPageState> = () => {
  const { ui } = useStore()
  const project: any = ui.selectedProject
  return (
    <ProjectLayout title="Project Building">
      <RedirectToDashboard projectRef={project?.ref ?? ''} />
    </ProjectLayout>
  )
}
export default withAuth(observer(ProjectBuildingPage))

type RedirectToDashboardState = {
  projectRef: string
}
const RedirectToDashboard: React.FC<RedirectToDashboardState> = ({ projectRef }) => {
  const router = useRouter()

  React.useEffect(() => {
    // Use redirect to reload store data properly after project has been
    // been created or unpaused, this is necessarily especially for unpausing
    // so that the dashboard fetches the updated connection strings
    window.location.replace(`/project/${projectRef}`)
  }, [])
  return null
}

import { FC, useEffect } from 'react'
import { useRouter } from 'next/router'
import { withAuth } from 'hooks'
import ProjectLayout from 'components/layouts'

const ProjectBuildingPage: FC = () => {
  return (
    <ProjectLayout title="Project Building">
      <RedirectToDashboard />
    </ProjectLayout>
  )
}
export default withAuth(ProjectBuildingPage)

const RedirectToDashboard: FC = () => {
  const router = useRouter()
  const { ref } = router.query

  useEffect(() => {
    // Use redirect to reload store data properly after project has been
    // been created or unpaused, this is necessarily especially for unpausing
    // so that the dashboard fetches the updated connection strings
    window.location.replace(`/project/${ref}`)
  }, [])
  return null
}

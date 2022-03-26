import { FC, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { useStore } from 'hooks'
import { Organization, Project } from 'types'

// Ideally these could all be within a _middleware when we use Next 12
const RouteValidationWrapper: FC = ({ children }) => {
  const { ui, app } = useStore()
  const orgsInitialized = app.organizations.isInitialized
  const projectsInitialized = app.projects.isInitialized

  const router = useRouter()
  const projectRef = router.query.ref
  const orgSlug = router.query.slug

  useEffect(() => {
    if (orgsInitialized && orgSlug) {
      // Check validity of organization that user is trying to access
      const organizations = app.organizations.list()
      const organizationSlugs = organizations.map((org: Organization) => org.slug)
      const isValidOrg = organizationSlugs.includes(orgSlug as string)

      if (!isValidOrg) {
        ui.setNotification({ category: 'error', message: 'This organization does not exist' })
        router.push('/')
        return
      }
    }
  }, [orgsInitialized])

  useEffect(() => {
    if (projectsInitialized && projectRef) {
      // Check validity of project that the user is trying to access
      const projects = app.projects.list()
      const projectRefs = projects.map((project: Project) => project.ref)
      const isValidProject = projectRefs.includes(projectRef as string)

      if (!isValidProject) {
        ui.setNotification({ category: 'error', message: 'This project does not exist' })
        router.push('/')
        return
      }
    }
  }, [projectsInitialized])

  return <>{children}</>
}

export default observer(RouteValidationWrapper)

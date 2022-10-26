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

  /**
   * Array of urls/routes that should be ignored
   */
  const excemptUrls: string[] = [
    // project creation route, allows the page to self determine it's own route, it will redirect to the first org
    // or prompt the user to create an organaization
    // this is used by database.dev, usually as /new/new-project
    '/new/[slug]',
    '/join',
  ]

  /**
   * Map through all the urls that are excluded
   * from route validation check
   *
   * @returns a boolean
   */
  function isExceptUrl() {
    return excemptUrls.includes(router?.pathname)
  }

  useEffect(() => {
    // check if current route is excempted from route validation check
    if (isExceptUrl()) return

    if (orgsInitialized && orgSlug) {
      // Check validity of organization that user is trying to access
      const organizations = app.organizations.list()
      const isValidOrg = organizations.some((org: Organization) => org.slug === orgSlug)

      if (!isValidOrg) {
        ui.setNotification({ category: 'error', message: 'This organization does not exist' })
        router.push('/projects')
        return
      }
    }
  }, [orgsInitialized])

  useEffect(() => {
    // check if current route is excempted from route validation check
    if (isExceptUrl()) return

    if (projectsInitialized && projectRef) {
      // Check validity of project that the user is trying to access
      const projects = app.projects.list()
      const isValidProject = projects.some((project: Project) => project.ref === projectRef)

      if (!isValidProject) {
        ui.setNotification({ category: 'error', message: 'This project does not exist' })
        router.push('/projects')
        return
      }
    }
  }, [projectsInitialized])

  return <>{children}</>
}

export default observer(RouteValidationWrapper)

import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { useIsLoggedIn, useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useFlag, useStore, useLatest } from 'hooks'
import { DEFAULT_HOME, IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'

// Ideally these could all be within a _middleware when we use Next 12
const RouteValidationWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref, slug, id } = useParams()
  const navLayoutV2 = useFlag('navigationLayoutV2')

  const isLoggedIn = useIsLoggedIn()
  const snap = useAppStateSnapshot()

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

  const { data: organizations, isSuccess: orgsInitialized } = useOrganizationsQuery({
    enabled: isLoggedIn,
  })
  const organizationsRef = useLatest(organizations)

  useEffect(() => {
    // check if current route is excempted from route validation check
    if (isExceptUrl() || !isLoggedIn) return

    if (orgsInitialized && slug) {
      // Check validity of organization that user is trying to access
      const organizations = organizationsRef.current ?? []
      const isValidOrg = organizations.some((org) => org.slug === slug)

      if (!isValidOrg) {
        ui.setNotification({ category: 'error', message: 'This organization does not exist' })
        router.push(navLayoutV2 ? `/org/${organizations[0].slug}` : DEFAULT_HOME)
        return
      }
    }
  }, [orgsInitialized])

  const { data: projects, isSuccess: projectsInitialized } = useProjectsQuery({
    enabled: isLoggedIn,
  })
  const projectsRef = useLatest(projects)

  useEffect(() => {
    // check if current route is excempted from route validation check
    if (isExceptUrl() || !isLoggedIn) return

    if (projectsInitialized && ref) {
      // Check validity of project that the user is trying to access
      const projects = projectsRef.current ?? []
      const isValidProject = projects.some((project) => project.ref === ref)
      const isValidBranch = IS_PLATFORM
        ? projects.some((project) => project.preview_branch_refs.includes(ref))
        : true

      if (!isValidProject && !isValidBranch) {
        ui.setNotification({ category: 'error', message: 'This project does not exist' })
        router.push(navLayoutV2 ? `/org/${organizations?.[0].slug}` : DEFAULT_HOME)
        return
      }
    }
  }, [projectsInitialized])

  useEffect(() => {
    if (orgsInitialized && slug) {
      // Save organization slug to local storage
      const organizations = organizationsRef.current ?? []
      const organization = organizations.find((org) => org.slug === slug)
      if (organization) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION, organization.slug)
      }
    }
  }, [slug, orgsInitialized])

  useEffect(() => {
    if (projectsInitialized && ref) {
      // Save organization slug to local storage
      const projects = projectsRef.current ?? []
      const project = projects.find((project) => project.ref === ref)
      const organizationId = project?.organization_id
      const organization = organizations?.find((organization) => organization.id === organizationId)
      if (organization) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION, organization.slug)
      }
    }
  }, [ref, projectsInitialized])

  useEffect(() => {
    if (ref !== undefined && id !== undefined) {
      if (router.pathname.endsWith('/sql/[id]') && id !== 'new') {
        snap.setDashboardHistory(ref, 'sql', id)
      }
      if (router.pathname.endsWith('/editor/[id]')) {
        snap.setDashboardHistory(ref, 'editor', id)
      }
    }
  }, [ref, id])

  return <>{children}</>
}

export default observer(RouteValidationWrapper)

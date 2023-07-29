import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useFlag, useStore } from 'hooks'
import useLatest from 'hooks/misc/useLatest'
import { useParams } from 'common'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

// Ideally these could all be within a _middleware when we use Next 12
const RouteValidationWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref, slug } = useParams()
  const navLayoutV2 = useFlag('navigationLayoutV2')

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

  const { data: organizations, isSuccess: orgsInitialized } = useOrganizationsQuery()
  const organizationsRef = useLatest(organizations)

  useEffect(() => {
    // check if current route is excempted from route validation check
    if (isExceptUrl()) return

    if (orgsInitialized && slug) {
      // Check validity of organization that user is trying to access
      const organizations = organizationsRef.current ?? []
      const isValidOrg = organizations.some((org) => org.slug === slug)

      if (!isValidOrg) {
        ui.setNotification({ category: 'error', message: 'This organization does not exist' })
        router.push(navLayoutV2 ? `/org/${organizations[0].slug}` : '/projects')
        return
      }
    }
  }, [orgsInitialized])

  const { data: projects, isSuccess: projectsInitialized } = useProjectsQuery()
  const projectsRef = useLatest(projects)

  useEffect(() => {
    // check if current route is excempted from route validation check
    if (isExceptUrl()) return

    if (projectsInitialized && ref) {
      // Check validity of project that the user is trying to access
      const projects = projectsRef.current ?? []
      const isValidProject = projects.some((project) => project.ref === ref)
      const isValidBranch = projects.some((project) => project.preview_branch_refs?.includes(ref))

      if (!isValidProject && !isValidBranch) {
        ui.setNotification({ category: 'error', message: 'This project does not exist' })
        router.push(navLayoutV2 ? `/org/${organizations?.[0].slug}` : '/projects')
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

  return <>{children}</>
}

export default observer(RouteValidationWrapper)

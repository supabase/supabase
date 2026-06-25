import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { TemporaryAccessProjectGrant } from '@/components/interfaces/TemporaryAccess/TemporaryAccess.types'
import { computeStatusFromApiRoles } from '@/components/interfaces/TemporaryAccess/TemporaryAccess.utils'
import { get } from '@/data/fetchers'
import { jitDbAccessKeys } from '@/data/jit-db-access/keys'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'

export function useMyTemporaryAccessGrantsQuery({ enabled = true }: { enabled?: boolean } = {}) {
  const { data: organizations = [] } = useOrganizationsQuery({ enabled })

  const orgProjectQueries = useQueries({
    queries: organizations.map((org) => ({
      queryKey: ['organizations', org.slug, 'projects-for-my-access'],
      queryFn: async () => {
        const { data, error } = await get('/platform/organizations/{slug}/projects', {
          params: {
            path: { slug: org.slug },
            query: { limit: 100, offset: 0 },
          },
        })
        if (error) return []
        return data.projects
      },
      enabled: enabled && !!org.slug,
      staleTime: 60_000,
    })),
  })

  const projects = useMemo(() => {
    const all: Array<{ ref: string; name: string; orgSlug: string; orgName: string }> = []
    organizations.forEach((org, index) => {
      const orgProjects = orgProjectQueries[index]?.data ?? []
      orgProjects.forEach((project) => {
        all.push({
          ref: project.ref,
          name: project.name,
          orgSlug: org.slug,
          orgName: org.name,
        })
      })
    })
    return all
  }, [organizations, orgProjectQueries])

  const selfGrantQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: jitDbAccessKeys.self(project.ref),
      queryFn: async () => {
        const { data, error } = await get(`/v1/projects/{ref}/database/jit`, {
          params: { path: { ref: project.ref } },
        })
        if (error) return null
        return data
      },
      enabled: enabled && !!project.ref,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: false,
    })),
  })

  const grants = useMemo(() => {
    const results: Array<
      TemporaryAccessProjectGrant & {
        orgSlug: string
        orgName: string
        status: ReturnType<typeof computeStatusFromApiRoles>
      }
    > = []

    projects.forEach((project, index) => {
      const data = selfGrantQueries[index]?.data
      if (!data?.user_roles?.length) return

      results.push({
        projectRef: project.ref,
        projectName: project.name,
        orgSlug: project.orgSlug,
        orgName: project.orgName,
        userRoles: data.user_roles,
        status: computeStatusFromApiRoles(data.user_roles),
      })
    })

    return results
  }, [projects, selfGrantQueries])

  const isLoading =
    orgProjectQueries.some((q) => q.isLoading) || selfGrantQueries.some((q) => q.isLoading)

  return { grants, isLoading }
}

/** Per-org projects hook used by onboarding after join */
export function useOrgProjectsForTemporaryAccess({ slug }: { slug?: string }) {
  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData?.pages]
  )

  const selfGrantQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: jitDbAccessKeys.self(project.ref),
      queryFn: async () => {
        const { data, error } = await get(`/v1/projects/{ref}/database/jit`, {
          params: { path: { ref: project.ref } },
        })
        if (error) return null
        return data
      },
      enabled: !!slug && !!project.ref,
      staleTime: 0,
      retry: false,
    })),
  })

  const grants = useMemo(() => {
    const results: TemporaryAccessProjectGrant[] = []
    projects.forEach((project, index) => {
      const data = selfGrantQueries[index]?.data
      if (!data?.user_roles?.length) return
      results.push({
        projectRef: project.ref,
        projectName: project.name,
        userRoles: data.user_roles,
      })
    })
    return results
  }, [projects, selfGrantQueries])

  const isLoading = selfGrantQueries.some((q) => q.isLoading)

  return { grants, isLoading }
}

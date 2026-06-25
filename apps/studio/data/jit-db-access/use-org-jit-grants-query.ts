import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { computeStatusFromApiRoles } from '@/components/interfaces/TemporaryAccess/TemporaryAccess.utils'
import { get } from '@/data/fetchers'
import { jitDbAccessKeys } from '@/data/jit-db-access/keys'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'

export type OrgMemberJitGrantSummary = {
  projectRef: string
  projectName: string
  userRoles: Array<{
    role: string
    expires_at?: number
    branches_only?: boolean
  }>
  status: ReturnType<typeof computeStatusFromApiRoles>
}

export function useOrgMemberJitGrantsQuery({
  slug,
  memberId,
  enabled = true,
}: {
  slug?: string
  memberId?: string
  enabled?: boolean
}) {
  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData?.pages]
  )

  const grantQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: [...jitDbAccessKeys.members(project.ref), 'member', memberId],
      queryFn: async () => {
        const { data, error } = await get(`/v1/projects/{ref}/database/jit/list`, {
          params: { path: { ref: project.ref } },
        })
        if (error) return null
        return data.items.find((item) => item.user_id === memberId) ?? null
      },
      enabled: enabled && !!memberId && !!project.ref,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    })),
  })

  const grantsByMember = useMemo(() => {
    const summaries: OrgMemberJitGrantSummary[] = []

    projects.forEach((project, index) => {
      const item = grantQueries[index]?.data
      if (!item || !item.user_roles?.length) return

      summaries.push({
        projectRef: project.ref,
        projectName: project.name,
        userRoles: item.user_roles,
        status: computeStatusFromApiRoles(item.user_roles),
      })
    })

    return summaries
  }, [grantQueries, projects])

  const isLoading = grantQueries.some((query) => query.isLoading)

  return { grants: grantsByMember, isLoading }
}

export function useOrgJitGrantsIndexQuery({
  slug,
  enabled = true,
}: {
  slug?: string
  enabled?: boolean
}) {
  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData?.pages]
  )

  const listQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: jitDbAccessKeys.members(project.ref),
      queryFn: async () => {
        const { data, error } = await get(`/v1/projects/{ref}/database/jit/list`, {
          params: { path: { ref: project.ref } },
        })
        if (error) return []
        return data.items
      },
      enabled: enabled && !!project.ref,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    })),
  })

  const grantsByUserId = useMemo(() => {
    const index = new Map<
      string,
      Array<{
        projectRef: string
        projectName: string
        userRoles: Array<{ role: string; expires_at?: number }>
        status: ReturnType<typeof computeStatusFromApiRoles>
      }>
    >()

    projects.forEach((project, projectIndex) => {
      const items = listQueries[projectIndex]?.data ?? []
      items.forEach((item) => {
        if (!item.user_roles?.length) return
        const existing = index.get(item.user_id) ?? []
        existing.push({
          projectRef: project.ref,
          projectName: project.name,
          userRoles: item.user_roles,
          status: computeStatusFromApiRoles(item.user_roles),
        })
        index.set(item.user_id, existing)
      })
    })

    return index
  }, [listQueries, projects])

  const isLoading = listQueries.some((query) => query.isLoading)

  return { grantsByUserId, isLoading }
}

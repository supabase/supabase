import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback } from 'react'

import { prefetchProjectDetail } from 'data/projects/project-detail-query'
import { useService } from 'lib/services/context'
import PrefetchableLink, { PrefetchableLinkProps } from './PrefetchableLink'

export function usePrefetchProjectIndexPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectsService = useService('projects')

  return useCallback(
    ({ projectRef }: { projectRef?: string }) => {
      // Prefetch code
      router.prefetch(`/project/${projectRef}`)

      // Prefetch data
      prefetchProjectDetail(queryClient, { ref: projectRef }, projectsService).catch(() => {
        // eat prefetching errors as they are not critical
      })
    },
    [queryClient, router, projectsService]
  )
}

interface ProjectIndexPageLinkProps extends Omit<PrefetchableLinkProps, 'href' | 'prefetcher'> {
  projectRef?: string
  href?: PrefetchableLinkProps['href']
}

export function ProjectIndexPageLink({
  href,
  projectRef,
  children,
  ...props
}: PropsWithChildren<ProjectIndexPageLinkProps>) {
  const prefetch = usePrefetchProjectIndexPage()

  return (
    <PrefetchableLink
      href={href || `/project/${projectRef}`}
      prefetcher={() => prefetch({ projectRef })}
      {...props}
    >
      {children}
    </PrefetchableLink>
  )
}

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback } from 'react'

import { prefetchProjectLogRequestsCount } from 'data/analytics/project-log-requests-count-query'
import { prefetchProjectLogStats } from 'data/analytics/project-log-stats-query'
import { prefetchProjectDetail } from 'data/projects/project-detail-query'
import PrefetchableLink, { PrefetchableLinkProps } from './PrefetchableLink'

export function usePrefetchProjectIndexPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCallback(
    ({ projectRef }: { projectRef?: string }) => {
      // Prefetch code
      router.prefetch(`/project/${projectRef}`)

      // Prefetch data
      prefetchProjectDetail(queryClient, {
        ref: projectRef,
      }).catch(() => {
        // eat prefetching errors as they are not critical
      })

      prefetchProjectLogRequestsCount(queryClient, {
        projectRef,
      }).catch(() => {
        // eat prefetching errors as they are not critical
      })

      prefetchProjectLogStats(queryClient, {
        projectRef,
        interval: 'hourly',
      }).catch(() => {
        // eat prefetching errors as they are not critical
      })
    },
    [queryClient, router]
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

import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, PropsWithChildren, useCallback } from 'react'

import { prefetchProjectLogRequestsCount } from 'data/analytics/project-log-requests-count-query'
import { prefetchProjectLogStats } from 'data/analytics/project-log-stats-query'
import { prefetchProjectDetail } from 'data/projects/project-detail-query'

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

type LinkProps = ComponentProps<typeof Link>

interface ProjectIndexPageLinkProps extends Omit<LinkProps, 'href'> {
  projectRef?: string
  href?: LinkProps['href']
}

export function ProjectIndexPageLink({
  href,
  projectRef,
  children,
  ...props
}: PropsWithChildren<ProjectIndexPageLinkProps>) {
  const prefetch = usePrefetchProjectIndexPage()

  return (
    <Link
      href={href || `/project/${projectRef}`}
      onMouseEnter={() => prefetch({ projectRef })}
      {...props}
    >
      {children}
    </Link>
  )
}

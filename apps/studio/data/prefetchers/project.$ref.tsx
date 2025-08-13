import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback } from 'react'

import { prefetchProjectDetail } from 'data/projects/project-detail-query'
import PrefetchableLink, { PrefetchableLinkProps } from './PrefetchableLink'
import { useParams } from 'next/navigation'

export function usePrefetchProjectIndexPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { slug } = useParams()

  return useCallback(
    ({ projectRef }: { projectRef?: string }) => {
      // Prefetch code
      router.prefetch(`/org/${slug}/project/${projectRef}`)

      // Prefetch data
      prefetchProjectDetail(queryClient, {
        ref: projectRef,
      }).catch(() => {
        // eat prefetching errors as they are not critical
      })
    },
    [queryClient, router]
  )
}

interface ProjectIndexPageLinkProps extends Omit<PrefetchableLinkProps, 'href' | 'prefetcher'> {
  projectRef?: string
  slug: string
  href?: PrefetchableLinkProps['href']
}

export function ProjectIndexPageLink({
  href,
  projectRef,
  slug,
  children,
  ...props
}: PropsWithChildren<ProjectIndexPageLinkProps>) {
  const prefetch = usePrefetchProjectIndexPage()

  return (
    <PrefetchableLink
      href={href || `/org/${slug}/project/${projectRef}`}
      prefetcher={() => prefetch({ projectRef })}
      {...props}
    >
      {children}
    </PrefetchableLink>
  )
}

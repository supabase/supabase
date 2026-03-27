import { useQueryClient } from '@tanstack/react-query'
import { useRouter as useAppRouter } from 'next/navigation'
import { useRouter as useCompatRouter } from 'next/compat/router'
import { useCallback, type PropsWithChildren } from 'react'

import { prefetchProjectDetail } from 'data/projects/project-detail-query'
import PrefetchableLink, { type PrefetchableLinkProps } from './PrefetchableLink'

/** `next/link` `href` can be a string or UrlObject; prefetch APIs expect a path string. */
function hrefToPrefetchPath(href: PrefetchableLinkProps['href']): string {
  if (href == null) return ''
  if (typeof href === 'string') return href
  const o = href as {
    pathname?: string | null
    search?: string | null
    query?: Record<string, string | string[] | undefined>
  }
  let path = o.pathname ?? ''
  if (o.search) {
    path += o.search.startsWith('?') ? o.search : `?${o.search}`
  } else if (o.query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(o.query)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v)
      } else {
        params.append(key, value)
      }
    }
    const qs = params.toString()
    if (qs) path += `?${qs}`
  }
  return path
}

export function usePrefetchProjectIndexPage() {
  const compatRouter = useCompatRouter()
  const appRouter = useAppRouter()
  const queryClient = useQueryClient()

  return useCallback(
    ({ projectRef, path }: { projectRef?: string; path: string }) => {
      // App Router routes (e.g. `/v2/project/...`) must use `next/navigation` prefetch.
      if (path.startsWith('/v2/')) {
        void appRouter.prefetch(path)
      } else if (compatRouter) {
        void compatRouter.prefetch(path)
      } else {
        void appRouter.prefetch(path)
      }

      if (projectRef) {
        prefetchProjectDetail(queryClient, { ref: projectRef }).catch(() => {
          // eat prefetching errors as they are not critical
        })
      }
    },
    [queryClient, compatRouter, appRouter]
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
  const resolvedHref = href ?? `/project/${projectRef}`
  const prefetchPath = hrefToPrefetchPath(resolvedHref)

  return (
    <PrefetchableLink
      href={resolvedHref}
      prefetcher={() => {
        if (!prefetchPath) return
        void prefetch({ projectRef, path: prefetchPath })
      }}
      {...props}
    >
      {children}
    </PrefetchableLink>
  )
}

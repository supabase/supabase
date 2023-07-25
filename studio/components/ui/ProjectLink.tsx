import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/router'
import { forwardRef, PropsWithChildren, PropsWithoutRef, useMemo } from 'react'

export type Override<T1, T2> = Omit<T1, keyof T2> & T2

function isValidUrl(urlString: string) {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}

const ProjectLink = forwardRef<
  HTMLAnchorElement,
  Override<
    Override<PropsWithoutRef<JSX.IntrinsicElements['a']>, NextLinkProps>,
    PropsWithChildren<{}>
  >
>(
  (
    {
      href,
      as: nextAs,
      prefetch,
      replace,
      scroll,
      shallow,
      children,
      className: overrideClassName,
      ...props
    },
    ref
  ) => {
    const { query } = useRouter()
    const { branch } = query

    const hrefWithBranch = useMemo(() => {
      if (typeof href === 'string') {
        const url = isValidUrl(href)
          ? new URL(href)
          : new URL(`https://supabase.com/${href.replace(/^\//, '')}`)
        const branchId = url.searchParams.get('branch')
        url.searchParams.delete('branch')

        const existingSearchParams = [...url.searchParams.entries()].reduce(
          (acc, [key, value]) => {
            let temp = acc[key]
            if (temp) {
              if (Array.isArray(temp)) {
                temp.push(value)
              } else {
                temp = [temp, value]
              }
            } else {
              temp = value
            }
            acc[key] = temp
            return acc
          },
          {} as {
            [key: string]: string | string[]
          }
        )

        return {
          pathname: url.pathname,
          query: {
            ...((branch !== undefined || branchId !== null) && { branch: branchId || branch }),
            ...existingSearchParams,
          },
        }
      } else {
        return {
          ...href,
          query: { ...(branch !== undefined && { branch }), ...(href.query as object) },
        }
      }
    }, [branch, href])

    return (
      <NextLink
        ref={ref}
        {...{
          href: hrefWithBranch,
          as: nextAs,
          prefetch,
          replace,
          scroll,
          shallow,
          className: overrideClassName,
          ...props,
        }}
      >
        {children}
      </NextLink>
    )
  }
)

ProjectLink.displayName = 'ProjectLink'
export default ProjectLink

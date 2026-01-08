import Link from 'next/link'
import type { ComponentProps, PropsWithChildren } from 'react'

import { takeBreadcrumbSnapshot } from 'lib/breadcrumbs'
import { createSupportFormUrl, type SupportFormUrlKeys } from './SupportForm.utils'

export const SupportLink = ({
  children,
  queryParams,
  ...props
}: PropsWithChildren<
  { queryParams?: Partial<SupportFormUrlKeys> } & Omit<ComponentProps<typeof Link>, 'href'>
>) => {
  const href = createSupportFormUrl(queryParams ?? {})

  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        takeBreadcrumbSnapshot()
        props.onClick?.(event)
      }}
    >
      {children}
    </Link>
  )
}

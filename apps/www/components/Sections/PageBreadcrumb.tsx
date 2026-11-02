import Link from 'next/link'
import { Fragment } from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

const PageBreadcrumb = ({ items }: Props) => (
  <nav
    aria-label="Breadcrumb"
    className="not-prose flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground-lighter"
  >
    {items.map((item, i) => (
      <Fragment key={item.label}>
        {i > 0 && <span aria-hidden="true">/</span>}
        {item.href ? (
          <Link href={item.href} className="hover:text-foreground transition-colors">
            {item.label}
          </Link>
        ) : (
          <span className="text-foreground">{item.label}</span>
        )}
      </Fragment>
    ))}
  </nav>
)

export default PageBreadcrumb

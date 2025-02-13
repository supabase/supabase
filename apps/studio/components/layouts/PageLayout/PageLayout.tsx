import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'

import { useParams } from 'common'
import { Button, cn, NavMenu, NavMenuItem } from 'ui'
import { PAGE_SIZE_CLASSES, type PageSize } from 'ui/src/lib/constants'
import { PageHeader } from '.'

export interface NavigationItem {
  id?: string
  label: string
  href?: string
  icon?: ReactNode
  onClick?: () => void
}

interface PageLayoutProps {
  children?: ReactNode
  title?: string
  subtitle?: string
  icon?: ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  primaryActions?: ReactNode
  secondaryActions?: ReactNode
  navigationItems?: NavigationItem[]
  className?: string
  size?: PageSize
  isCompact?: boolean
}

/**
 * For rendering a general single column based UI (which covers most of the dashboard's use case)
 *
 * Pages that would use this would for example be: Auth Sign In / Up, Project settings, Advisors, etc
 *
 * Pages that would deviate from this are those with dedicated UI, for example: Table Editor, SQL Editor, etc
 *
 * Handles rendering the following UI behaviours:
 * - Page padding depending on the size property
 * - Top level breadcrumbs (If applicable)
 * - Top level page header (If applicable)
 * - Top level tab navigations (If applicable)
 * @param title - Title rendered in page header
 * @param subtitle - Subtitle rendered in page header, below title
 * @param icon - Icon rendered in Page header, to the left of title and subtitle
 * @param breadcrumbs - Breadcrumbs rendered in page header, above title
 * @param primaryActions - TBD
 * @param secondaryActions - TBD
 * @param navigationItems - Tab navigation rendered below the page header
 * @param className - Optional additional class names to be applied
 * @param size - Controls padding of the page layout (Default: 'default')
 * @param isCompact - TBD (Default: false)
 */
const PageLayout = ({
  children,
  title,
  subtitle,
  icon,
  breadcrumbs = [],
  primaryActions,
  secondaryActions,
  navigationItems = [],
  className,
  size = 'default',
  isCompact = false,
}: PageLayoutProps) => {
  const router = useRouter()
  const { ref } = useParams()

  return (
    <div className="w-full">
      <div
        className={cn(
          'w-full mx-auto',
          PAGE_SIZE_CLASSES[size],
          size === 'full' && (isCompact ? 'px-6 border-b' : 'px-8 border-b'),
          isCompact ? 'pt-4' : 'pt-12',
          navigationItems.length === 0 && size === 'full' && (isCompact ? 'pb-4' : 'pb-8'),
          className
        )}
      >
        {/* Header section */}
        {(title || subtitle || primaryActions || secondaryActions || breadcrumbs.length > 0) && (
          <PageHeader
            title={title}
            subtitle={subtitle}
            icon={icon}
            breadcrumbs={breadcrumbs}
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
            isCompact={isCompact}
          />
        )}

        {/* Navigation section */}
        {navigationItems.length > 0 && (
          <NavMenu className={cn('mt-4', size === 'full' && 'border-none')}>
            {navigationItems.map((item) => (
              <NavMenuItem key={item.label} active={router.pathname === item.href}>
                {item.href ? (
                  <Link
                    href={!!ref ? item.href.replace('[ref]', ref) : item.href}
                    className="inline-flex items-center gap-2"
                    onClick={item.onClick}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                  </Link>
                ) : (
                  <Button type="link" onClick={item.onClick}>
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                  </Button>
                )}
              </NavMenuItem>
            ))}
          </NavMenu>
        )}
      </div>

      {/* Content section */}
      <main>{children}</main>
    </div>
  )
}

export default PageLayout

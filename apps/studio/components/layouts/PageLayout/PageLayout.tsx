import { ReactNode } from 'react'
import { cn } from 'ui'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { Breadcrumbs, PageHeader, PageNavigation } from '.'
import type { BreadcrumbItem, NavigationItem } from '.'

interface PageLayoutProps {
  children?: ReactNode
  title?: string
  subtitle?: string
  headerActions?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  navigationItems?: NavigationItem[]
  hideBreadcrumbs?: boolean
  hideHeader?: boolean
  hideNavigation?: boolean
  className?: string
}

const PageLayout = ({
  children,
  title,
  subtitle,
  headerActions,
  breadcrumbs,
  navigationItems,
  hideBreadcrumbs = false,
  hideHeader = false,
  hideNavigation = false,
  className,
}: PageLayoutProps) => {
  return (
    <div className={cn('flex flex-col', className)}>
      {!hideBreadcrumbs && breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      {!hideHeader && (title || subtitle || headerActions) && (
        <PageHeader title={title || ''} subtitle={subtitle} actions={headerActions} />
      )}

      {!hideNavigation && navigationItems && navigationItems.length > 0 && (
        <>
          <div className="mt-4">
            <PageNavigation items={navigationItems} />
          </div>
          <ScaffoldDivider />
        </>
      )}

      <ScaffoldContainer className="my-8">{children}</ScaffoldContainer>
    </div>
  )
}

export default PageLayout

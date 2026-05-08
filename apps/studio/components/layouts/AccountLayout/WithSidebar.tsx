import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PropsWithChildren, ReactNode } from 'react'
import { cn } from 'ui'

import type { SidebarSection } from './AccountLayout.types'
import { getActiveKey, toSubMenuSections } from './AccountLayout.utils'
import { SubMenu } from '@/components/ui/ProductMenu/SubMenu'

interface WithSidebarProps {
  title?: string
  sections: SidebarSection[]
  header?: ReactNode
  backToDashboardURL?: string
}

export const WithSidebar = ({
  title,
  header,
  children,
  sections,
  backToDashboardURL,
}: PropsWithChildren<WithSidebarProps>) => {
  const noContent = !sections

  return (
    <div className="flex flex-col md:flex-row h-full">
      {!noContent && (
        <SidebarContent
          title={title}
          header={header}
          sections={sections}
          backToDashboardURL={backToDashboardURL}
          className="hidden md:flex"
        />
      )}
      <div className="flex flex-1 flex-col">
        <div className="flex-1 grow overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export const SidebarContent = ({
  header,
  sections,
  backToDashboardURL,
  className,
}: PropsWithChildren<Omit<WithSidebarProps, 'breadcrumbs'>> & { className?: string }) => {
  const page = getActiveKey(sections)
  const subMenuSections = toSubMenuSections(sections)

  return (
    <>
      <div
        id="with-sidebar"
        className={cn(
          'h-full bg-dash-sidebar flex flex-col justify-between',
          'hide-scrollbar w-full md:w-64 md:border-r border-default',
          className
        )}
      >
        <div className="flex-1 flex flex-col">
          {backToDashboardURL && (
            <div className="shrink-0 hidden md:block">
              <div className="flex h-12 max-h-12 items-center border-b px-6 border-default">
                <Link
                  href={backToDashboardURL}
                  className="flex text-sm flex-row gap-2 items-center text-foreground-lighter focus-visible:text-foreground hover:text-foreground"
                >
                  <ArrowLeft strokeWidth={1.5} size={16} />
                  Back to dashboard
                </Link>
              </div>
            </div>
          )}
          {header && header}
          <div className="flex-1 overflow-auto">
            <div className="flex flex-col">
              <SubMenu sections={subMenuSections} page={page} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

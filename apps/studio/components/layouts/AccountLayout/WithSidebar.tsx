import { isUndefined } from 'lodash'
import { ArrowUpRight, LogOut, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PropsWithChildren, ReactNode, useState } from 'react'
import { Badge, cn, Menu } from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'
import { LayoutHeader } from '../ProjectLayout/LayoutHeader'
import type { SidebarLink, SidebarSection } from './AccountLayout.types'
import { useAppStateSnapshot } from 'state/app-state'

interface WithSidebarProps {
  title: string
  breadcrumbs: any[]
  sections: SidebarSection[]
  header?: ReactNode
  subitems?: any[]
  subitemsParentKey?: number
  hideSidebar?: boolean
  customSidebarContent?: ReactNode
  backToDashboardURL?: string
}

export const WithSidebar = ({
  title,
  header,
  breadcrumbs = [],
  children,
  sections,
  subitems,
  subitemsParentKey,
  hideSidebar = false,
  customSidebarContent,
  backToDashboardURL,
}: PropsWithChildren<WithSidebarProps>) => {
  const noContent = !sections && !customSidebarContent
  const { mobileMenuOpen, setMobileMenuOpen } = useAppStateSnapshot()

  return (
    <div className="flex flex-col md:flex-row h-full">
      {!hideSidebar && !noContent && (
        <SidebarContent
          title={title}
          header={header}
          sections={sections}
          subitems={subitems}
          subitemsParentKey={subitemsParentKey}
          customSidebarContent={customSidebarContent}
          backToDashboardURL={backToDashboardURL}
          className="hidden md:flex"
        />
      )}
      <div className="flex flex-1 flex-col">
        <div className="flex-1 flex-grow overflow-y-auto">
          <div className="mx-auto max-w-7xl w-full px-6 lg:px-14 xl:px-28 2xl:px-32 py-16">

            {children}
          </div>
        </div>
      </div>
      <MobileSheetNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SidebarContent
          title={title}
          header={header}
          sections={sections}
          subitems={subitems}
          subitemsParentKey={subitemsParentKey}
          customSidebarContent={customSidebarContent}
          backToDashboardURL={backToDashboardURL}
        />
      </MobileSheetNav>
    </div>
  )
}

export const SidebarContent = ({
  title,
  header,
  sections,
  subitems,
  subitemsParentKey,
  customSidebarContent,
  backToDashboardURL,
  className,
}: PropsWithChildren<Omit<WithSidebarProps, 'breadcrumbs'>> & { className?: string }) => {
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
          {title && (
            <div className="flex-shrink-0">
              <div className="flex h-12 max-h-12 items-center border-b px-6 border-default">
                <h4 className="mb-0 text-lg truncate" title={title}>
                  {title}
                </h4>
              </div>
            </div>
          )}
          {header && header}
          <div className="flex-1 overflow-auto">
            <div className="flex flex-col space-y-8">
              <Menu type="pills">
                {customSidebarContent}
                {sections.map((section, idx) => (
                  <div key={section.key || section.heading}>
                    {Boolean(section.heading) ? (
                      <SectionWithHeaders
                        key={section.key}
                        section={section}
                        subitems={subitems}
                        subitemsParentKey={subitemsParentKey}
                      />
                    ) : (
                      <div className="my-6 space-y-8">
                        <div className="mx-3">
                          {section.links.map((link, i: number) => {
                            const isActive = link.isActive && !subitems
                            return (
                              <Menu.Item
                                key={`${link.key}-${i}`}
                                rounded
                                active={isActive}
                                icon={link.icon}
                              >
                                <Link href={link.href || ''} className="block">
                                  <div className="flex w-full items-center justify-between gap-1">
                                    <div className="flex items-center gap-2 truncate w-full">
                                      <span className="truncate">{link.label}</span>
                                    </div>
                                  </div>
                                </Link>
                              </Menu.Item>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {idx !== sections.length - 1 && <div className="h-px w-full bg-border-overlay" />}
                  </div>
                ))}
              </Menu>
            </div>
          </div>
        </div>
        {backToDashboardURL && (
          <div className="flex-shrink-0 px-6 py-6">
            <Link
              href={backToDashboardURL}
              className="flex text-xs flex-row gap-2 items-center text-foreground-lighter focus-visible:text-foreground hover:text-foreground"
            >
              <ArrowLeft strokeWidth={1.5} size={14} />
              Back to dashboard
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

interface SectionWithHeadersProps {
  section: SidebarSection
  subitems?: any[]
  subitemsParentKey?: number
}

const SectionWithHeaders = ({ section, subitems, subitemsParentKey }: SectionWithHeadersProps) => (
  <div key={section.heading} className="my-6 space-y-8">
    <div className="mx-3">
      {section.heading && (
        <Menu.Group
          title={
            <div className="flex flex-col space-y-2 uppercase font-mono">
              <span>{section.heading}</span>
            </div>
          }
        />
      )}
      <div>
        {section.links.map((link, i: number) => {
          const isActive = link.isActive && !subitems
          return (
            <Menu.Item key={`${link.key}-${i}`} rounded active={isActive} icon={link.icon}>
              <Link href={link.href || ''} className="block">
                <div className="flex w-full items-center justify-between gap-1">
                  <div className="flex items-center gap-2 truncate w-full">
                    <span className="truncate">{link.label}</span>
                  </div>
                </div>
              </Link>
            </Menu.Item>
          )
        })}
      </div>
    </div>
  </div>
)

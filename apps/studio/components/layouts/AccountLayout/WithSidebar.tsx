import { isUndefined } from 'lodash'
import Link from 'next/link'
import { ReactNode } from 'react'

import { useFlag } from 'hooks/ui/useFlag'
import { Badge, IconArrowUpRight, IconLogOut, Menu } from 'ui'
import { LayoutHeader } from '../ProjectLayout/LayoutHeader'
import type { SidebarLink, SidebarSection } from './AccountLayout.types'

interface WithSidebarProps {
  title: string
  breadcrumbs: any[]
  sections: SidebarSection[]
  header?: ReactNode
  subitems?: any[]
  subitemsParentKey?: number
  hideSidebar?: boolean
  customSidebarContent?: ReactNode
  children: ReactNode
}

const WithSidebar = ({
  title,
  header,
  breadcrumbs = [],
  children,
  sections,
  subitems,
  subitemsParentKey,
  hideSidebar = false,
  customSidebarContent,
}: WithSidebarProps) => {
  const noContent = !sections && !customSidebarContent
  const navLayoutV2 = useFlag('navigationLayoutV2')

  return (
    <div className="flex h-full">
      {!hideSidebar && !noContent && (
        <div
          id="with-sidebar"
          className={[
            'h-full bg-dash-sidebar',
            'hide-scrollbar w-64 overflow-auto border-r border-default',
          ].join(' ')}
        >
          {title && (
            <div className="mb-2">
              <div className="flex h-12 max-h-12 items-center border-b px-6 border-default">
                <h4 className="mb-0 text-lg truncate" title={title}>
                  {title}
                </h4>
              </div>
            </div>
          )}
          {header && header}
          <div className="-mt-1">
            <Menu>
              {customSidebarContent}
              {sections.map((section) => {
                return Boolean(section.heading) ? (
                  <SectionWithHeaders
                    key={section.key}
                    section={section}
                    subitems={subitems}
                    subitemsParentKey={subitemsParentKey}
                  />
                ) : (
                  <div className="border-b py-5 px-6 border-default" key={section.key}>
                    <SidebarItem
                      links={section.links}
                      subitems={subitems}
                      subitemsParentKey={subitemsParentKey}
                    />
                  </div>
                )
              })}
            </Menu>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col">
        {!navLayoutV2 && <LayoutHeader breadcrumbs={breadcrumbs} />}
        <div className="flex-1 flex-grow overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
export default WithSidebar

interface SectionWithHeadersProps {
  section: SidebarSection
  subitems?: any[]
  subitemsParentKey?: number
}

const SectionWithHeaders = ({ section, subitems, subitemsParentKey }: SectionWithHeadersProps) => (
  <div key={section.heading} className="border-b py-5 px-6 border-default">
    {section.heading && <Menu.Group title={section.heading} />}
    {section.versionLabel && (
      <div className="mb-1 px-3">
        <Badge variant="warning">{section.versionLabel}</Badge>
      </div>
    )}
    {
      <SidebarItem
        links={section.links}
        subitems={subitems}
        subitemsParentKey={subitemsParentKey}
      />
    }
  </div>
)
interface SidebarItemProps {
  links: SidebarLink[]
  subitems?: any[]
  subitemsParentKey?: number
}

const SidebarItem = ({ links, subitems, subitemsParentKey }: SidebarItemProps) => {
  return (
    <ul className="space-y-1">
      {links.map((link, i: number) => {
        // disable active state for link with subitems
        const isActive = link.isActive && !subitems

        let render: any = (
          <SidebarLinkItem
            key={`${link.key}-${i}-sidebarItem`}
            id={`${link.key}-${i}`}
            isActive={isActive}
            label={link.label}
            href={link.href}
            onClick={link.onClick}
            isExternal={link.isExternal || false}
          />
        )

        if (subitems && link.subitemsKey === subitemsParentKey) {
          const subItemsRender = subitems.map((y: any, i: number) => (
            <SidebarLinkItem
              key={`${y.key || y.as}-${i}-sidebarItem`}
              id={`${y.key || y.as}-${i}`}
              isSubitem={true}
              label={y.label}
              onClick={y.onClick}
              isExternal={link.isExternal || false}
            />
          ))
          render = [render, ...subItemsRender]
        }
        return render
      })}
    </ul>
  )
}

interface SidebarLinkProps extends SidebarLink {
  id: string
  isSubitem?: boolean
}

const SidebarLinkItem = ({
  id,
  label,
  href,
  isActive,
  isSubitem,
  isExternal,
  onClick,
}: SidebarLinkProps) => {
  if (isUndefined(href)) {
    let icon
    if (isExternal) {
      icon = <IconArrowUpRight size={'tiny'} />
    }

    if (label === 'Log out') {
      icon = <IconLogOut size={'tiny'} />
    }

    return (
      <Menu.Item
        rounded
        key={id}
        style={{
          marginLeft: isSubitem ? '.5rem' : '0rem',
        }}
        active={isActive ? true : false}
        onClick={onClick || (() => {})}
        icon={icon}
      >
        {isSubitem ? <p className="text-sm">{label}</p> : label}
      </Menu.Item>
    )
  }

  return (
    <Link href={href || ''} className="block" target={isExternal ? '_blank' : '_self'}>
      <span className="group flex max-w-full cursor-pointer items-center space-x-2 border-default py-1 font-normal outline-none ring-foreground focus-visible:z-10 focus-visible:ring-1 group-hover:border-foreground-muted">
        {isExternal && (
          <span className="truncate text-sm text-foreground-lighter transition group-hover:text-foreground-light">
            <IconArrowUpRight size={'tiny'} />
          </span>
        )}
        <span
          title={label}
          className="w-full truncate text-sm text-foreground-light transition group-hover:text-foreground"
        >
          {isSubitem ? <p>{label}</p> : label}
        </span>
      </span>
    </Link>
  )
}

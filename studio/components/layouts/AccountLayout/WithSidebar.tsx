import { FC, ReactNode } from 'react'
import { Menu, Badge } from '@supabase/ui'

import { useFlag } from 'hooks'
import LayoutHeader from '../ProjectLayout/LayoutHeader'
import SidebarItem from './SidebarItem'
import { SidebarLink, SidebarLinkGroup } from './AccountLayout.types'

interface Props {
  title: string
  breadcrumbs: any[]
  links: SidebarLinkGroup[] | SidebarLink[]
  header?: ReactNode
  subitems?: any[]
  subitemsParentKey?: number
  hideSidebar?: boolean
  customSidebarContent?: ReactNode
  children: ReactNode
}

const WithSidebar: FC<Props> = ({
  title,
  header,
  breadcrumbs = [],
  children,
  links,
  subitems,
  subitemsParentKey,
  hideSidebar = false,
  customSidebarContent,
}) => {
  const noContent = !links && !customSidebarContent
  const linksHaveHeaders = links && (links[0] as any)?.heading

  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  return (
    <div className="flex max-h-full">
      {!hideSidebar && !noContent && (
        <div
          id="with-sidebar"
          style={{ height: maxHeight, maxHeight }}
          className={[
            'bg-sidebar-linkbar-light dark:bg-sidebar-linkbar-dark h-full',
            'hide-scrollbar dark:border-dark w-64 overflow-auto border-r',
          ].join(' ')}
        >
          {title && (
            <div className="dark:border-dark flex h-12 max-h-12 items-center border-b px-6 mb-2">
              <h4>{title}</h4>
            </div>
          )}
          {header !== undefined && header}
          <div className="-mt-1">
            <Menu>
              {customSidebarContent}
              {links && linksHaveHeaders ? (
                <LinksWithHeaders
                  links={links as SidebarLinkGroup[]}
                  subitems={subitems}
                  subitemsParentKey={subitemsParentKey}
                />
              ) : null}
              {!linksHaveHeaders && links ? (
                <LinksWithoutHeaders
                  links={links as SidebarLink[]}
                  subitems={subitems}
                  subitemsParentKey={subitemsParentKey}
                />
              ) : null}
            </Menu>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <LayoutHeader breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex-grow overflow-auto">{children}</div>
      </div>
    </div>
  )
}
export default WithSidebar

const LinksWithHeaders: FC<any> = ({ links, subitems, subitemsParentKey }) => {
  return links.map((x: any, i: number) => (
    <div key={x.heading || `heading_${i}`} className="dark:border-dark border-b py-5 px-6">
      {x.heading && <Menu.Group title={x.heading} />}
      {x.versionLabel && (
        <div className="mb-1 px-3">
          <Badge color="yellow">{x.versionLabel}</Badge>
        </div>
      )}
      {
        <LinksWithoutHeaders
          links={x.links}
          subitems={subitems}
          subitemsParentKey={subitemsParentKey}
        />
      }
    </div>
  ))
}

const LinksWithoutHeaders: FC<{
  links: SidebarLink[]
  subitems?: any[]
  subitemsParentKey?: number
}> = ({ links, subitems, subitemsParentKey }) => {
  return (
    <ul className="space-y-1">
      {links.map((x: SidebarLink, i: number) => {
        // Disable active state for link with subitems
        const isActive = x.isActive && !subitems
        let render: any = (
          <SidebarItem
            key={`${x.key}-${i}-sidebarItem`}
            id={`${x.key}-${i}`}
            isActive={isActive}
            label={x.label}
            href={x.href}
            onClick={x.onClick}
            isExternal={x.isExternal || false}
          />
        )

        if (subitems && x.subitemsKey === subitemsParentKey) {
          const subItemsRender = subitems.map((y: any, i: number) => (
            <SidebarItem
              key={`${y.key || y.as}-${i}-sidebarItem`}
              id={`${y.key || y.as}-${i}`}
              label={y.label}
              onClick={y.onClick}
              isSubitem={true}
              isExternal={x.isExternal || false}
            />
          ))
          render = [render, ...subItemsRender]
        }

        return render
      })}
    </ul>
  )
}

import Link from 'next/link'
import { FC, ReactNode } from 'react'
import { isUndefined } from 'lodash'
import { Menu, Typography, IconArrowUpRight, Badge } from '@supabase/ui'
import { useFlag } from 'hooks'
import LayoutHeader from '../ProjectLayout/LayoutHeader'

interface Props {
  title: string
  breadcrumbs: any[]
  links: any[]
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
  const linksHaveHeaders = links && links[0].heading

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
            <div className="mb-2">
              <div className="dark:border-dark flex h-12 max-h-12 items-center border-b px-6">
                <Typography.Title level={4} className="mb-0">
                  {title}
                </Typography.Title>
              </div>
            </div>
          )}
          {header && header}
          <div className="-mt-1">
            <Menu>
              {customSidebarContent}
              {links && linksHaveHeaders ? (
                <LinksWithHeaders
                  links={links}
                  subitems={subitems}
                  subitemsParentKey={subitemsParentKey}
                />
              ) : null}
              {!linksHaveHeaders && links ? (
                <LinksWithoutHeaders
                  links={links}
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
  return links.map((x: any) => (
    <div key={x.heading} className="dark:border-dark border-b py-5 px-6">
      <Menu.Group title={x.heading} />
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
const LinksWithoutHeaders: FC<any> = ({ links, subitems, subitemsParentKey }) => {
  return (
    <ul className="space-y-1">
      {links.map((x: any, i: number) => {
        // disable active state for link with subitems
        const isActive = x.isActive && !subitems

        let render: any = (
          <SidebarItem
            key={`${x.key || x.as}-${i}-sidebarItem`}
            id={`${x.key || x.as}-${i}`}
            slug={x.key}
            isActive={isActive}
            label={x.label}
            href={x.href}
            onClick={x.onClick}
            external={x.external || false}
          />
        )

        if (subitems && x.subitemsKey === subitemsParentKey) {
          const subItemsRender = subitems.map((y: any, i: number) => (
            <SidebarItem
              key={`${y.key || y.as}-${i}-sidebarItem`}
              id={`${y.key || y.as}-${i}`}
              slug={y.key}
              isSubitem={true}
              label={y.label}
              onClick={y.onClick}
              external={x.external || false}
            />
          ))
          render = [render, ...subItemsRender]
        }

        return render
      })}
    </ul>
  )
}

const SidebarItem: FC<any> = ({ id, label, href, isActive, isSubitem, onClick, external }) => {
  if (isUndefined(href)) {
    return (
      <Menu.Item
        rounded
        key={id}
        style={{
          marginLeft: isSubitem && '.5rem',
        }}
        active={isActive ? true : false}
        onClick={onClick || (() => {})}
        icon={external && <IconArrowUpRight size={'tiny'} />}
      >
        {isSubitem ? <p className="text-sm">{label}</p> : label}
      </Menu.Item>
    )
  }

  return (
    <Link href={href || ''}>
      <a className="block" target={external ? '_blank' : '_self'}>
        <button
          className="ring-scale-1200 border-scale-500 group-hover:border-scale-900 group flex max-w-full cursor-pointer items-center space-x-2 py-1 font-normal outline-none focus-visible:z-10 focus-visible:ring-1"
          onClick={onClick || (() => {})}
        >
          {external && (
            <span className="text-scale-900 group-hover:text-scale-1100 truncate text-sm transition">
              <IconArrowUpRight size={'tiny'} />
            </span>
          )}
          <span
            title={label}
            className="text-scale-1100 group-hover:text-scale-1200 w-full truncate text-sm transition"
          >
            {isSubitem ? <p>{label}</p> : label}
          </span>
        </button>
      </a>
    </Link>
  )
}

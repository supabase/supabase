import Link from 'next/link'
import { CSSProperties, FC, ReactNode } from 'react'
import { Menu, Typography, IconArrowUpRight, Badge } from '@supabase/ui'
import { isUndefined } from 'lodash'
import LayoutHeader from '../ProjectLayout/LayoutHeader'

interface Props {
  title: string
  breadcrumbs: any[]
  links: any[]
  header?: ReactNode
  subitems?: any[]
  subitemsParentKey?: number
  sidebarStyle?: CSSProperties
  hideSidebar?: boolean
  customSidebarContent?: ReactNode
  children: ReactNode
}

const WithSidebar: FC<Props> = ({
  title,
  header,
  breadcrumbs = [],
  children,
  sidebarStyle,
  links,
  subitems,
  subitemsParentKey,
  hideSidebar = false,
  customSidebarContent,
}) => {
  const noContent = !links && !customSidebarContent
  const linksHaveHeaders = links && links[0].heading

  return (
    <div className={`flex `}>
      {!hideSidebar && !noContent && (
        <div
          id="with-sidebar"
          className="
            w-64 h-screen overflow-auto bg-sidebar-linkbar-light dark:bg-sidebar-linkbar-dark hide-scrollbar
            border-r dark:border-dark
          "
          style={sidebarStyle}
        >
          {title && (
            <div className="mb-2">
              <div className="max-h-12 h-12 flex items-center border-b dark:border-dark px-6">
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
      <div className="flex-1 flex flex-col h-screen">
        <LayoutHeader breadcrumbs={breadcrumbs} />
        <div className="flex-grow flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
export default WithSidebar

const LinksWithHeaders: FC<any> = ({ links, subitems, subitemsParentKey }) => {
  return links.map((x: any) => (
    <div key={x.heading} className="py-5 border-b dark:border-dark px-6">
      <Menu.Group title={x.heading} />
      {x.versionLabel && (
        <div className="px-3 mb-1">
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
        {isSubitem ? <Typography.Text small>{label}</Typography.Text> : label}
      </Menu.Item>
    )
  }

  return (
    <Link href={href || ''}>
      <a className="block" target={external ? '_blank' : '_self'}>
        <button
          className="cursor-pointer flex space-x-2 items-center outline-none focus-visible:ring-1 ring-scale-1200 focus-visible:z-10 group py-1 font-normal border-scale-500 group-hover:border-scale-900"
          onClick={onClick || (() => {})}
        >
          {external && (
            <span className="transition truncate text-sm text-scale-900 group-hover:text-scale-1100">
              <IconArrowUpRight size={'tiny'} />
            </span>
          )}
          <span className="transition truncate text-sm w-full text-scale-1100 group-hover:text-scale-1200">
            {isSubitem ? <p>{label}</p> : label}
          </span>
        </button>
      </a>
    </Link>
  )
}

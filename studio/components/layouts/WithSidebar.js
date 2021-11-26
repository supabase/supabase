import Link from 'next/link'
// import IconSidebar from 'components/Layouts/IconSidebar'
import { Menu, Typography, IconArrowUpRight, Badge } from '@supabase/ui'
import LayoutHeader from './ProjectLayout/LayoutHeader'

/**
 * layout for all pages under /project/ route
 *
 * @param {String}                      title
 * @param {JSX.Element|JSX.Element[]}   header
 * @param {JSX.Element|JSX.Element[]}   children
 * @param {CSSProperties}               sidebarStyle
 * @param {Array<Object>}               icons                     1st level group links
 * @param {Array<Object>}               links                     2nd level links related to group link
 * @param {Array<Object>}               subitems                  subitems link to different sections on the same page
 * @param {Number}                      subitemsParentKey         index of subitems parent link
 * @param {boolean}                     hideIconSidebar           Hides the left-most icon bar
 * @param {JSX.Element|JSX.Element[]}   customSidebarContent      For injecting custom JSX into the sidebar
 * @param {string}                      projectRef                Project ref string used in url
 */

const WithSidebar = ({
  title,
  header,
  breadcrumbs = [],
  children,
  sidebarStyle,
  links,
  subitems,
  subitemsParentKey,
  icons = [],
  hideIconSidebar = false,
  hideSidebar = false,
  customSidebarContent,
  projectRef,
}) => {
  const noContent = !links && !customSidebarContent
  const linksHaveHeaders = links && links[0].heading

  return (
    <div className={`flex `}>
      {/* {!hideIconSidebar && <IconSidebar links={icons} projectRef={projectRef} key="IconSidebar" />} */}
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

const LinksWithHeaders = ({ links, subitems, subitemsParentKey }) => {
  return links.map((x) => (
    <div key={x.heading} className="py-5 border-b dark:border-dark px-3">
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
const LinksWithoutHeaders = ({ links, subitems, subitemsParentKey }) => {
  return (
    <ul className="dash-product-menu space-y-1">
      {links.map((x, i) => {
        // disable active state for link with subitems
        const isActive = x.isActive && !subitems
        let render = (
          <SidebarItem
            key={`${x.key || x.as}-${i}-sidebarItem`}
            id={`${x.key || x.as}-${i}`}
            slug={x.key}
            isActive={isActive}
            label={x.label}
            href={x.href}
            as={x.as}
            onClick={x.onClick}
            external={x.external || false}
          />
        )
        if (subitems && x.subitemsKey === subitemsParentKey) {
          const subItemsRender = subitems.map((y, i) => (
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

const SidebarItem = ({ id, label, as, href, slug, isActive, isSubitem, onClick, external }) => {
  return (
    <Link href={href || ''} as={as || ''}>
      <a className="block" target={external ? '_blank' : '_self'}>
        <Menu.Item
          rounded
          style={{
            marginLeft: isSubitem && '.5rem',
          }}
          active={isActive ? true : false}
          key={id}
          id={slug}
          onClick={onClick || (() => {})}
          icon={external && <IconArrowUpRight size={'tiny'} />}
        >
          {isSubitem ? <Typography.Text small>{label}</Typography.Text> : label}
        </Menu.Item>
      </a>
    </Link>
  )
}

'use client'

import { ChevronLeft, ChevronRight, House } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, type MouseEvent, type PropsWithChildren } from 'react'
import { cn } from 'ui'

import type { DropdownMenuItem } from '../Navigation.types'
import type { MenuId } from './NavigationMenu'
import {
  DocsSidebarNavContext,
  useDocsSidebarNav,
  type DocsSidebarNavState,
  type SidebarLevel,
} from './DocsSidebarNavContext'
import { isActiveHref, isReferencePath } from './DocsSidebarNav.utils'
import { MenuItem, MenuItemLabel } from './GlobalNavigationMenu'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import { SidebarGroupLabel } from './SidebarGroupLabel'
import { useNavItems } from '@/features/IaNav'

interface DocsSidebarNavProviderProps extends PropsWithChildren {
  menuId: MenuId
}

interface DocsSidebarNavTopProps {
  className?: string
}

interface DocsSidebarResourcesProps {
  className?: string
}

interface PageStackOptions {
  activeItem: DropdownMenuItem | undefined
  activeGroup: DropdownMenuItem | undefined
  referenceSection: DropdownMenuItem | undefined
}

interface LevelViewProps {
  level: SidebarLevel
}

interface HomeLinkProps {
  isCurrent: boolean
  onSectionSelect: (href: string) => void
}

interface LevelButtonProps extends PropsWithChildren {
  level: SidebarLevel
  onLevelOpen: (level: SidebarLevel) => void
}

interface ProductLinkProps extends PropsWithChildren {
  item: DropdownMenuItem
  isActive: boolean
  onLevelOpen: (level: SidebarLevel) => void
}

interface GroupViewProps {
  group: DropdownMenuItem
}

interface SectionLinkProps {
  item: DropdownMenuItem
  isActive: boolean
  onSectionSelect: (href: string) => void
}

interface SectionLabelProps {
  item: DropdownMenuItem
}

const SECTIONS_LEVEL: SidebarLevel = { kind: 'sections' }

const LEVEL_ROW_CLASS_NAME =
  'group/level -ml-2 flex h-8 items-center gap-2 rounded-md p-2 text-sm transition-colors focus-ring hover:bg-surface-200 hover:text-foreground'

const MENU_ROW_CLASS_NAME = '-ml-2 w-auto transition-colors hover:bg-surface-200'

const RESOURCES_LABEL = 'Resources'

const REFERENCE_LABEL = 'Reference'

// external sites like status stay in the shared resources menu but out of the footer
const FOOTER_RESOURCE_HREFS = [
  '/guides/resources/glossary',
  'https://supabase.com/changelog',
  '/contributing',
]

const isEnabled = (item: DropdownMenuItem) => item.enabled !== false

const getGroupItems = (group: DropdownMenuItem) => (group.menuItems ?? []).flat().filter(isEnabled)

const getFooterResources = (sections: DropdownMenuItem[]) => {
  const resources = (
    sections.find((section) => section.label === RESOURCES_LABEL)?.menuItems?.flat() ?? []
  ).filter(isEnabled)
  return FOOTER_RESOURCE_HREFS.flatMap((href) => resources.filter((item) => item.href === href))
}

const getLevelLabel = (level: SidebarLevel) => {
  if (level.kind === 'sections') return 'Home'
  if (level.kind === 'section') return level.section.label
  return level.item.label
}

// reference libraries share the level names but have no guide tree to open
const hasGuideTree = (navItems: Record<string, unknown>, level: string | undefined) => {
  const menu = level ? navItems[level] : undefined
  return typeof menu === 'object' && menu !== null && 'items' in menu
}

// most option-1 trees leave out their home page, and the header row only goes back.
// the glossary row links a page in its tree, so the tree home is the overview then
const getOverviewHref = (navItems: Record<string, unknown>, item: DropdownMenuItem) => {
  const menu = item.level ? navItems[item.level] : undefined
  if (typeof menu !== 'object' || menu === null || !('items' in menu)) return undefined
  if (!Array.isArray(menu.items)) return undefined
  const treeUrls = new Set(menu.items.map((row) => row?.url))
  const homeHref = 'url' in menu && typeof menu.url === 'string' ? menu.url : undefined
  return [item.href, homeHref].find((href) => href !== undefined && !treeUrls.has(href))
}

const getPageStack = ({
  activeItem,
  activeGroup,
  referenceSection,
}: PageStackOptions): SidebarLevel[] => {
  // reference pages have a nav of their own, so the reference list is their root
  if (referenceSection) return [{ kind: 'section', section: referenceSection }]
  if (!activeItem) return [SECTIONS_LEVEL]
  const productLevel: SidebarLevel = { kind: 'product', item: activeItem }
  // a single page section, like start, has no section list of its own
  if (!activeGroup) return [SECTIONS_LEVEL, productLevel]
  return [SECTIONS_LEVEL, { kind: 'section', section: activeGroup }, productLevel]
}

// follows the docs-ia-mvp-v1 variant
const useSidebarSections = () => {
  const { GLOBAL_MENU_ITEMS } = useNavItems()
  const sections = GLOBAL_MENU_ITEMS.map(([section]) => section).filter(isEnabled)

  return {
    sectionItems: sections.flatMap((section) =>
      section.menuItems ? getGroupItems(section) : [section]
    ),
    // resources sit in a block pinned under the list, so the list leaves them out
    listSections: sections.filter((section) => section.label !== RESOURCES_LABEL),
    resourceItems: getFooterResources(sections),
  }
}

const useDocsSidebarNavState = (menuId: MenuId): DocsSidebarNavState => {
  const pathname = usePathname() ?? ''
  const { sectionItems, listSections } = useSidebarSections()
  const navItems: Record<string, unknown> = useNavItems()
  // null follows the current page. browsing to other levels keeps a stack of its own
  const [browseStack, setBrowseStack] = useState<SidebarLevel[] | null>(null)
  const [prevPathname, setPrevPathname] = useState(pathname)
  // ids only grow, so an element that saw an earlier change still plays the next one
  const levelChangeCount = useRef(0)
  const [levelChangeId, setLevelChangeId] = useState<number | null>(null)

  // a new page opens its own levels, so browsing from the last page resets
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setBrowseStack(null)
    setLevelChangeId(null)
  }

  // option-1 menu ids can share a tree, like realtime and api, so products match on the tree
  const pageTree = navItems[menuId]
  const treeItems = pageTree
    ? sectionItems.filter((item) => item.level && navItems[item.level] === pageTree)
    : []
  // products can nest, like terraform in deployment, so the longest link that holds the page wins
  const activeItem =
    sectionItems.find((item) => item.href === pathname) ??
    treeItems.reduce<DropdownMenuItem | undefined>(
      (longest, item) =>
        item.href &&
        pathname.startsWith(`${item.href}/`) &&
        item.href.length > (longest?.href?.length ?? 0)
          ? item
          : longest,
      undefined
    ) ??
    treeItems[0]
  const activeGroup = activeItem
    ? listSections.find((group) => getGroupItems(group).includes(activeItem))
    : undefined
  const referenceSection = isReferencePath(pathname)
    ? listSections.find((section) => section.label === REFERENCE_LABEL)
    : undefined
  const stack = browseStack ?? getPageStack({ activeItem, activeGroup, referenceSection })
  const level = stack[stack.length - 1]

  const onLevelOpen = (next: SidebarLevel) => {
    levelChangeCount.current += 1
    setLevelChangeId(levelChangeCount.current)
    setBrowseStack([...stack, next])
  }
  const onLevelJump = (index: number) => {
    levelChangeCount.current += 1
    setLevelChangeId(levelChangeCount.current)
    setBrowseStack(stack.slice(0, index + 1))
  }
  const onSectionSelect = (href: string) => {
    // a link to the current page keeps the route, so the page levels come back here
    if (href !== pathname) return
    setBrowseStack(null)
  }
  const levelChangeRef = (node: HTMLElement | null) => {
    if (!node || levelChangeId === null || node.dataset.levelChangeId === String(levelChangeId))
      return
    node.dataset.levelChangeId = String(levelChangeId)
    // the container can stay mounted, so a reflow lets the enter animation play again
    delete node.dataset.levelEnter
    void node.offsetWidth
    node.dataset.levelEnter = ''
    // a level change can unmount the focused control, so focus moves into the new level
    if (document.activeElement !== document.body) return
    node.querySelector<HTMLElement>('a[href], button')?.focus()
  }

  return {
    pathname,
    stack,
    level,
    activeItem,
    onLevelOpen,
    onLevelJump,
    onSectionSelect,
    levelChangeRef,
  }
}

// the top block sits outside the scrolling list, so both read one shared state
export const DocsSidebarNavProvider = ({ menuId, children }: DocsSidebarNavProviderProps) => (
  <DocsSidebarNavContext value={useDocsSidebarNavState(menuId)}>{children}</DocsSidebarNavContext>
)

export const DocsSidebarNavTop = ({ className }: DocsSidebarNavTopProps) => {
  const { pathname, stack, level, onLevelJump, onSectionSelect } = useDocsSidebarNav()
  // the reference list is its own root, and the top bar already names it
  if (stack.length < 2 && level.kind !== 'sections') return null
  if (stack.length < 2) {
    return (
      <nav aria-label="Sidebar levels" className={cn('min-w-0 items-center pl-1', className)}>
        <HomeLink isCurrent={pathname === '/'} onSectionSelect={onSectionSelect} />
      </nav>
    )
  }

  const parentIndex = stack.length - 2
  const parentLabel = getLevelLabel(stack[parentIndex])
  const handleBackClick = () => onLevelJump(parentIndex)

  return (
    <nav aria-label="Sidebar levels" className={cn('min-w-0 items-center pl-1', className)}>
      <button
        type="button"
        tabIndex={0}
        aria-label={`${getLevelLabel(level)}, back to ${parentLabel}`}
        onClick={handleBackClick}
        className={cn(
          'group flex h-8 w-full min-w-0 cursor-pointer items-center rounded-md',
          'text-sm font-medium text-foreground transition-colors hover:bg-surface-200 focus-inset'
        )}
      >
        <TopRowIcon>
          <ChevronLeft aria-hidden strokeWidth={2} className="size-4" />
        </TopRowIcon>
        <span className="min-w-0 truncate px-1">{getLevelLabel(level)}</span>
      </button>
    </nav>
  )
}

export const DocsSidebarNav = ({ children }: PropsWithChildren) => {
  const { pathname, level, activeItem, levelChangeRef } = useDocsSidebarNav()
  const navItems = useNavItems()
  const isPageTree = level.kind === 'product' && level.item === activeItem
  const overviewHref = level.kind === 'product' ? getOverviewHref(navItems, level.item) : undefined
  const overviewLink = overviewHref ? (
    <MenuItem
      href={overviewHref}
      title="Getting Started"
      aria-current={overviewHref === pathname ? 'page' : undefined}
      className={cn(
        MENU_ROW_CLASS_NAME,
        'hidden lg:flex',
        overviewHref === pathname && 'text-foreground'
      )}
    />
  ) : null

  return (
    <>
      {isPageTree ? null : (
        <div ref={levelChangeRef} className="docs-sidebar-level hidden lg:flex lg:flex-col lg:pt-2">
          {overviewLink}
          <LevelView level={level} />
        </div>
      )}
      <div
        ref={isPageTree ? levelChangeRef : undefined}
        className={cn('docs-sidebar-level lg:pt-2', !isPageTree && 'lg:hidden')}
      >
        {isPageTree ? overviewLink : null}
        {children}
      </div>
    </>
  )
}

export const DocsSidebarResources = ({ className }: DocsSidebarResourcesProps) => {
  const pathname = usePathname() ?? ''
  const { resourceItems } = useSidebarSections()

  return (
    <nav aria-label="Resources" className={cn('flex-col', className)}>
      <ul className="flex flex-col">
        {resourceItems.map((item) => {
          // footer links have no child pages, so only the exact page is current
          const isActive = item.href === pathname
          return (
            <li key={item.label}>
              <MenuItem
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(MENU_ROW_CLASS_NAME, isActive && 'text-foreground')}
              >
                <SectionLabel item={item} />
              </MenuItem>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const HomeLink = ({ isCurrent, onSectionSelect }: HomeLinkProps) => {
  const handleClick = () => onSectionSelect('/')

  return (
    <Link
      href="/"
      aria-current={isCurrent ? 'page' : undefined}
      onClick={handleClick}
      className="group flex h-8 min-w-0 items-center rounded-md text-sm font-medium text-foreground focus-inset"
    >
      <TopRowIcon>
        <House aria-hidden strokeWidth={2} className="size-4" />
      </TopRowIcon>
      <span className="min-w-0 truncate px-1">Home</span>
    </Link>
  )
}

const LevelView = ({ level }: LevelViewProps) => {
  if (level.kind === 'sections') return <SectionsView />
  if (level.kind === 'section') return <GroupView group={level.section} />
  return <NavigationMenuGuideList id={level.item.level ?? ''} />
}

const SectionsView = () => {
  const { listSections } = useSidebarSections()
  const { pathname, onLevelOpen } = useDocsSidebarNav()

  return (
    <nav aria-label="Docs sections">
      <ul className="flex flex-col">
        {listSections
          .filter((section) => section.label !== REFERENCE_LABEL)
          .map((section) => (
            <li key={section.label} className="flex flex-col">
              {section.menuItems ? (
                <LevelButton level={{ kind: 'section', section }} onLevelOpen={onLevelOpen}>
                  <SectionLabel item={section} />
                </LevelButton>
              ) : (
                <ProductLink
                  item={section}
                  isActive={isActiveHref(section.href, pathname)}
                  onLevelOpen={onLevelOpen}
                >
                  <SectionLabel item={section} />
                </ProductLink>
              )}
            </li>
          ))}
      </ul>
    </nav>
  )
}

const LevelButton = ({ level, onLevelOpen, children }: LevelButtonProps) => {
  const handleClick = () => onLevelOpen(level)

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={handleClick}
      className={cn(LEVEL_ROW_CLASS_NAME, 'cursor-pointer text-left text-foreground-light')}
    >
      {children}
      <LevelChevron />
    </button>
  )
}

// the level opens on click, so the pages show before the overview route loads
const ProductLink = ({ item, isActive, onLevelOpen, children }: ProductLinkProps) => {
  const handleClick = (event: MouseEvent) => {
    // a modified click opens another tab, so this tab keeps its level
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    onLevelOpen({ kind: 'product', item })
  }

  return (
    <Link
      href={item.href ?? ''}
      aria-current={isActive ? 'page' : undefined}
      onClick={handleClick}
      className={cn(LEVEL_ROW_CLASS_NAME, isActive ? 'text-foreground' : 'text-foreground-light')}
    >
      {children}
      <LevelChevron />
    </Link>
  )
}

const GroupView = ({ group }: GroupViewProps) => {
  const { activeItem, onLevelOpen, onSectionSelect } = useDocsSidebarNav()
  const navItems = useNavItems()

  return (
    <nav aria-label={group.label}>
      <ul className="flex flex-col">
        {getGroupItems(group).map((item) => {
          if (!item.href) {
            // the reference list has one heading, and the header already names it
            if (group.label === REFERENCE_LABEL) return null
            return (
              <li key={`${group.label}-${item.label}`} className="mt-1 mb-1 first:mt-0 first:pt-2">
                <SidebarGroupLabel className="pb-0.5">{item.label}</SidebarGroupLabel>
              </li>
            )
          }
          // products can share a path prefix, so only the product of this page is current
          const isActive = item === activeItem
          return (
            <li key={`${group.label}-${item.label}`} className="flex flex-col">
              {hasGuideTree(navItems, item.level) ? (
                <ProductLink item={item} isActive={isActive} onLevelOpen={onLevelOpen}>
                  <SectionLabel item={item} />
                </ProductLink>
              ) : (
                <SectionLink item={item} isActive={isActive} onSectionSelect={onSectionSelect} />
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const SectionLink = ({ item, isActive, onSectionSelect }: SectionLinkProps) => {
  const handleClick = () => onSectionSelect(item.href ?? '')

  return (
    <MenuItem
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      onClick={handleClick}
      className={cn(MENU_ROW_CLASS_NAME, isActive && 'text-foreground')}
    >
      <SectionLabel item={item} />
    </MenuItem>
  )
}

const SectionLabel = ({ item }: SectionLabelProps) => (
  <MenuItemLabel
    title={item.label}
    icon={item.icon}
    community={item.community}
    isNew={item.new}
    experimental={item.experimental}
  />
)

const LevelChevron = () => (
  <ChevronRight
    aria-hidden
    strokeWidth={2}
    className="size-4 shrink-0 text-foreground-muted group-hover/level:text-foreground-lighter"
  />
)

const TopRowIcon = ({ children }: PropsWithChildren) => (
  <span className="flex w-6 shrink-0 justify-center text-foreground-lighter group-hover:text-foreground group-focus-visible:text-foreground">
    {children}
  </span>
)

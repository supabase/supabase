import {
  NavSectionCaret,
  NavSectionContent,
  NavSectionList,
} from '~/components/Navigation/NavSection'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Accordion } from 'radix-ui'
import React, { useEffect, useRef } from 'react'
import { cn } from 'ui'

import { useHasSectionHeader } from './DocsSidebarNavContext'
import MenuIconPicker from './MenuIconPicker'

type NavAccordionItem = {
  name?: string
  url?: string
  enabled?: boolean
  items?: NavAccordionItem[]
}

function hasActiveDescendant(item: NavAccordionItem, pathname: string): boolean {
  if (item.enabled === false) return false
  if (item.url === pathname) return true
  return item.items?.some((child) => hasActiveDescendant(child, pathname)) ?? false
}

function isRenderable(item: NavAccordionItem): boolean {
  if (item.enabled === false) return false
  if (item.url) return true

  return item.items?.some(isRenderable) ?? false
}

function groupLinks(item: NavAccordionItem): Array<{ name: string; url: string }> {
  return (item.items ?? [])
    .filter((child) => isRenderable(child))
    .flatMap((child) => [
      ...(child.url && child.name ? [{ name: child.name, url: child.url }] : []),
      ...groupLinks(child),
    ])
}

const HeaderLink = React.memo(function HeaderLink(props: {
  title: string
  id: string
  url: string
}) {
  const pathname = usePathname()

  return (
    <span
      className={[
        ' ',
        !props.title && 'capitalize',
        props.url === pathname ? 'text-primary' : 'hover:text-primary text-foreground',
      ].join(' ')}
    >
      {props.title ?? props.id}
    </span>
  )
})

const ContentAccordionLink = React.memo(function ContentAccordionLink(props: any) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const childItems = props.subItem.items ?? []
  const activeItem =
    props.subItem.url === pathname &&
    !childItems.some((child: NavAccordionItem) => child.url === pathname)
  const activeItemRef = useRef<HTMLLIElement>(null)
  const enabledChildren = childItems.filter(isRenderable)
  const hasChildren = enabledChildren.length > 0

  const isChildActive = enabledChildren.some((child: NavAccordionItem) =>
    hasActiveDescendant(child, pathname)
  )

  const accordionValue = props.subItem.url || props.subItem.name

  const LinkContainer = (props) => {
    const isExternal = props.url.startsWith('https://')

    return (
      <Link
        href={props.url}
        className={props.className}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {props.children}
      </Link>
    )
  }

  useEffect(() => {
    // scroll to active item
    if (activeItem && activeItemRef.current) {
      // this is a hack, but seems a common one on Stackoverflow
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
    }
  })

  if (!hasChildren && !props.subItem.url) return null

  return (
    <li ref={!hasChildren && activeItem ? activeItemRef : null}>
      {hasChildren ? (
        <Accordion.Root
          collapsible
          type="single"
          className="space-y-0.5"
          defaultValue={isChildActive ? accordionValue : undefined}
        >
          <Accordion.Item key={accordionValue} value={accordionValue}>
            <Accordion.Trigger
              className={[
                'flex items-center gap-2 w-full layout-v2:min-h-8 layout-v2:py-1.5',
                'cursor-pointer transition text-sm',
                'focus-inset rounded-md',
                activeItem
                  ? 'text-primary font-medium layout-v2:text-foreground layout-v2:[font-weight:inherit]'
                  : 'hover:text-foreground text-foreground-lighter',
              ].join(' ')}
            >
              <span className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {props.subItem.icon && (
                    <Image
                      alt={props.subItem.name}
                      src={`${props.subItem.icon}${!resolvedTheme?.includes('dark') ? '-light' : ''}.svg`}
                      width={15}
                      height={15}
                    />
                  )}
                  {props.subItem.name}
                </div>
                <NavSectionCaret />
              </span>
            </Accordion.Trigger>
            <Accordion.Content asChild>
              <NavSectionContent>
                <NavSectionList>
                  {enabledChildren.map((child) => {
                    if (child.items && child.items.length > 0) {
                      return <ContentAccordionLink key={child.name} subItem={child} />
                    }

                    return (
                      <li key={`${props.subItem.name}-${child.url}`}>
                        <Link
                          href={child.url}
                          className={[
                            'relative block py-1.25 pl-1 -ml-1 cursor-pointer transition text-sm',
                            'layout-v2:py-1.5 layout-v2:pl-3 layout-v2:-ml-3 layout-v2:pr-2',
                            'focus-inset rounded-md layout-v2:rounded-l-none layout-v2:hover:bg-surface-200',
                            child.url === pathname
                              ? 'text-primary layout-v2:text-foreground layout-v2:before:absolute layout-v2:before:left-0 layout-v2:before:top-1/2 layout-v2:before:h-4 layout-v2:before:w-px layout-v2:before:-translate-y-1/2 layout-v2:before:bg-brand'
                              : 'hover:text-primary text-foreground-lighter layout-v2:hover:text-foreground',
                          ].join(' ')}
                        >
                          {child.url === pathname && (
                            <span
                              aria-hidden
                              className="absolute left-[-13px] top-1/2 h-[1em] w-px -translate-y-1/2 bg-current layout-v2:hidden"
                            />
                          )}
                          {child.name}
                        </Link>
                      </li>
                    )
                  })}
                </NavSectionList>
              </NavSectionContent>
            </Accordion.Content>
            <ul hidden>
              {groupLinks(props.subItem).map((child) => (
                <li key={`${child.name}-${child.url}`}>
                  <Link href={child.url}>{child.name}</Link>
                </li>
              ))}
            </ul>
          </Accordion.Item>
        </Accordion.Root>
      ) : (
        <LinkContainer
          url={props.subItem.url}
          className={[
            'flex items-center gap-2',
            'layout-v2:min-h-8 layout-v2:-ml-2 layout-v2:px-2 layout-v2:py-1.5',
            'cursor-pointer transition text-sm',
            'focus-inset rounded-md layout-v2:hover:bg-surface-200',
            activeItem
              ? 'text-primary font-medium layout-v2:text-foreground layout-v2:[font-weight:inherit]'
              : 'hover:text-foreground text-foreground-lighter',
          ].join(' ')}
          parent={props.subItem.parent}
        >
          <div className="flex items-center gap-2">
            {props.subItem.icon && (
              <Image
                alt={props.subItem.name}
                src={`${props.subItem.icon}${!resolvedTheme?.includes('dark') ? '-light' : ''}.svg`}
                width={15}
                height={15}
              />
            )}
            {props.subItem.name}
          </div>
        </LinkContainer>
      )}
    </li>
  )
})

const ContentLink = React.memo(function ContentLink(props: any) {
  const pathname = usePathname()

  return (
    <li className={cn('mb-1.5 layout-v2:mb-0', props.isLayoutV2Only && 'hidden layout-v2:block')}>
      <Link
        href={props.url}
        className={[
          'layout-v2:flex layout-v2:min-h-8 layout-v2:items-center layout-v2:gap-2',
          'layout-v2:-ml-2 layout-v2:px-2 layout-v2:py-1.5',
          'cursor-pointer transition text-sm',
          'focus-inset rounded-md layout-v2:hover:bg-surface-200',
          props.url === pathname
            ? 'text-primary layout-v2:text-foreground'
            : 'hover:text-foreground text-foreground-lighter',
        ].join(' ')}
      >
        {props.icon && (
          <Image alt={props.icon} width={12} height={12} src={`${pathname}${props.icon}`} />
        )}
        {props.name}
      </Link>
    </li>
  )
})

const Content = (props) => {
  const { menu, id } = props
  // the sidebar header row links to the section overview, so the tree leaves it out
  const hasSectionHeader = useHasSectionHeader()

  if (menu.enabled === false) {
    return null
  }

  return (
    <div className="relative w-full flex flex-col gap-0 pb-5">
      <Link href={menu.url ?? ''} className="max-lg:hidden layout-v2:hidden">
        <div className="flex items-center gap-3 my-3 text-primary">
          <MenuIconPicker icon={menu.icon} />
          <HeaderLink title={menu.title} url={menu.url} id={id} />
        </div>
      </Link>

      <ul data-testid="docs-guide-navigation-list" className="flex flex-col gap-0">
        {menu.items.map((entry) => {
          if (entry.enabled === false) return null
          if (hasSectionHeader && entry.url === menu.url) return null

          if (entry.items && entry.items.length > 0) {
            const enabledItems = entry.items.filter(isRenderable)
            if (enabledItems.length === 0) return null

            return (
              <li key={entry.name} className="group/entry">
                <div className="flex flex-col gap-2.5 layout-v2:gap-1">
                  <div className="h-px w-full bg-border my-3 layout-v2:hidden"></div>
                  <span className="font-mono text-xs uppercase text-foreground font-medium tracking-wider layout-v2:hidden">
                    {entry.name}
                  </span>
                  <span className="hidden layout-v2:flex items-center gap-3 pt-3 pb-1.5 text-xs font-medium text-foreground-lighter/80 group-first/entry:pt-2">
                    {entry.shortName ?? entry.name}
                    <span aria-hidden className="h-px flex-1 bg-border" />
                  </span>
                  <ul className="flex flex-col gap-2.5 layout-v2:gap-0">
                    {enabledItems.map((subItem) => (
                      <ContentAccordionLink key={subItem.name} subItem={subItem} />
                    ))}
                  </ul>
                </div>
              </li>
            )
          }

          return entry.url ? (
            <ContentLink
              url={entry.url}
              icon={entry.icon}
              name={entry.name}
              isLayoutV2Only={entry.isLayoutV2Only}
              key={entry.name}
            />
          ) : null
        })}
      </ul>
    </div>
  )
}

export default React.memo(Content)

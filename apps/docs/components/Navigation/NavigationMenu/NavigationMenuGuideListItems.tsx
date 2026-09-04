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

import MenuIconPicker from './MenuIconPicker'

type NavAccordionItem = {
  url?: string
  items?: NavAccordionItem[]
}

function hasActiveDescendant(item: NavAccordionItem, pathname: string): boolean {
  if (item.url === pathname) return true
  return item.items?.some((child) => hasActiveDescendant(child, pathname)) ?? false
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
        props.url === pathname ? 'text-brand-link' : 'hover:text-brand-link text-foreground',
      ].join(' ')}
    >
      {props.title ?? props.id}
    </span>
  )
})

const ContentAccordionLink = React.memo(function ContentAccordionLink(props: any) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const activeItem = props.subItem.url === pathname
  const activeItemRef = useRef<HTMLLIElement>(null)
  const childItems = props.subItem.items ?? []
  const enabledChildren = childItems.filter((child) => child.enabled !== false)
  const hasChildren = enabledChildren.length > 0

  const isChildActive = enabledChildren.some((child: NavAccordionItem) =>
    hasActiveDescendant(child, pathname)
  )

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
          defaultValue={isChildActive ? props.subItem.url : undefined}
        >
          <Accordion.Item key={props.subItem.url || props.subItem.name} value={props.subItem.url}>
            <Accordion.Trigger
              className={[
                'flex items-center gap-2 w-full',
                'cursor-pointer transition text-sm',
                'hover:text-foreground text-foreground-lighter',
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
                            'relative block py-1.25 cursor-pointer transition text-sm',
                            child.url === pathname
                              ? 'text-brand-link'
                              : 'hover:text-brand-link text-foreground-lighter',
                          ].join(' ')}
                        >
                          {child.url === pathname && (
                            <span
                              aria-hidden
                              className="absolute left-[-13px] top-1/2 h-[1em] w-px -translate-y-1/2 bg-current"
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
          </Accordion.Item>
        </Accordion.Root>
      ) : (
        <LinkContainer
          url={props.subItem.url}
          className={[
            'flex items-center gap-2',
            'cursor-pointer transition text-sm',
            activeItem
              ? 'text-brand-link font-medium'
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
    <li className="mb-1.5">
      <Link
        href={props.url}
        className={[
          'cursor-pointer transition text-sm',
          props.url === pathname
            ? 'text-brand-link'
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

  if (menu.enabled === false) {
    return null
  }

  return (
    <div className="relative w-full flex flex-col gap-0 pb-5">
      <Link href={menu.url ?? ''}>
        <div className="flex items-center gap-3 my-3 text-brand-link">
          <MenuIconPicker icon={menu.icon} />
          <HeaderLink title={menu.title} url={menu.url} id={id} />
        </div>
      </Link>

      <ul data-testid="docs-guide-navigation-list" className="flex flex-col gap-0">
        {menu.items.map((entry) => {
          if (entry.enabled === false) return null

          if (entry.items && entry.items.length > 0) {
            const enabledItems = entry.items.filter((item) => item.enabled !== false)
            if (enabledItems.length === 0) return null

            return (
              <li key={entry.name}>
                <div className="flex flex-col gap-2.5">
                  <div className="h-px w-full bg-border my-3"></div>
                  <span className="font-mono text-xs uppercase text-foreground font-medium tracking-wider">
                    {entry.name}
                  </span>
                  <ul className="flex flex-col gap-2.5">
                    {enabledItems.map((subItem) => (
                      <ContentAccordionLink key={subItem.name} subItem={subItem} />
                    ))}
                  </ul>
                </div>
              </li>
            )
          }

          return entry.url ? (
            <ContentLink url={entry.url} icon={entry.icon} name={entry.name} key={entry.name} />
          ) : null
        })}
      </ul>
    </div>
  )
}

export default React.memo(Content)

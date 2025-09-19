import * as Accordion from '@radix-ui/react-accordion'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ChevronRight } from 'lucide-react'
import Image from 'next/legacy/image'
import Link from 'next/link'
import React, { useRef } from 'react'

import MenuIconPicker from './MenuIconPicker'

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
  const activeItemRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null)
  const hasSubItems = props.subItem.items && props.subItem.items.length > 0

  // Callback ref for better React compatibility
  const setActiveItemRef = React.useCallback(
    (element: HTMLButtonElement | HTMLAnchorElement | null) => {
      // Store ref for potential future use
      if (activeItemRef.current !== element) {
        ;(
          activeItemRef as React.MutableRefObject<HTMLButtonElement | HTMLAnchorElement | null>
        ).current = element
      }
      // Scroll to active item when ref is set
      if (activeItem && element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 0)
      }
    },
    [activeItem]
  )

  const LinkContainer = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, any>(
    (props, ref) => {
      const isExternal = props.url.startsWith('https://')

      if (hasSubItems) {
        return (
          <Accordion.Trigger
            className={props.className}
            ref={ref as React.ForwardedRef<HTMLButtonElement>}
          >
            {props.children}
          </Accordion.Trigger>
        )
      }

      return (
        <Link
          href={props.url}
          className={props.className}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        >
          {props.children}
        </Link>
      )
    }
  )

  LinkContainer.displayName = 'LinkContainer'

  return (
    <>
      {props.subItemIndex === 0 && (
        <>
          <div className="h-px w-full bg-border my-3"></div>
          <span className="font-mono text-xs uppercase text-foreground font-medium tracking-wider">
            {props.parent.name}
          </span>
        </>
      )}
      {hasSubItems ? (
        <Accordion.Root collapsible type="single" className="space-y-0.5">
          <Accordion.Item key={props.subItem.url || props.subItem.name} value={props.subItem.url}>
            <LinkContainer
              url={props.subItem.url}
              className={[
                'flex items-center gap-2',
                'cursor-pointer transition text-sm',
                hasSubItems ? 'justify-between' : '',
                activeItem
                  ? 'text-brand-link font-medium'
                  : 'hover:text-foreground text-foreground-lighter',
              ].join(' ')}
              parent={props.subItem.parent}
              ref={setActiveItemRef}
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
              {hasSubItems && (
                <ChevronRight
                  className="transition text-foreground-lighter data-open-parent:rotate-90"
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
            </LinkContainer>

            <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up ml-2">
              {props.subItem.items
                .filter((subItem) => subItem.enabled !== false)
                .map((subSubItem) => {
                  return (
                    <li key={subSubItem.url || subSubItem.name}>
                      <Link
                        href={`${subSubItem.url}`}
                        className={[
                          'cursor-pointer transition text-sm',
                          subSubItem.url === pathname
                            ? 'text-brand-link'
                            : 'hover:text-brand-link text-foreground-lighter',
                        ].join(' ')}
                      >
                        {subSubItem.name}
                      </Link>
                    </li>
                  )
                })}
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
          ref={setActiveItemRef}
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
    </>
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
    <ul className={['relative w-full flex flex-col gap-0 pb-5'].join(' ')}>
      <Link href={menu.url ?? ''}>
        <div className="flex items-center gap-3 my-3 text-brand-link">
          <MenuIconPicker icon={menu.icon} />
          <HeaderLink title={menu.title} url={menu.url} id={id} />
        </div>
      </Link>

      {menu.items
        .filter((item) => item.enabled !== false)
        .map((x) => {
          return (
            <div key={x.name}>
              {x.items && x.items.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {x.items
                    .filter((item) => item.enabled !== false)
                    .map((subItem, subItemIndex) => {
                      return (
                        <ContentAccordionLink
                          key={subItem.name}
                          subItem={subItem}
                          subItemIndex={subItemIndex}
                          parent={x}
                        />
                      )
                    })}
                </div>
              ) : x.url ? (
                <ContentLink url={x.url} icon={x.icon} name={x.name} key={x.name} />
              ) : null}
            </div>
          )
        })}
    </ul>
  )
}

export default React.memo(Content)

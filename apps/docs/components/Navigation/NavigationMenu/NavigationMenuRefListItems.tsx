import * as Accordion from '@radix-ui/react-accordion'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { Fragment, useEffect, useRef } from 'react'
import { IconChevronLeft, IconChevronUp, cn } from 'ui'

import RevVersionDropdown from '~/components/RefVersionDropdown'
import { useMenuActiveRefId } from '~/hooks/useMenuState'
import { DocsEvent, fireCustomEvent } from '~/lib/events'
import HomeMenuIconPicker from './HomeMenuIconPicker'
import * as NavItems from './NavigationMenu.constants'

const UNTITLED = '__UNTITLED_NAV_CATEGORY__'

type RefMenuItem = {
  id: string
  name: string
  href: string
  slug: string
  items?: Array<RefMenuItem>
}

type RefMenuCategory = {
  id: string
  name: string
  items: Array<RefMenuItem>
}

const HeaderLink = React.memo(function HeaderLink(props: any) {
  return (
    <span className={['text-base text-brand-600 ', !props.title && 'capitalize'].join(' ')}>
      {props.title ?? props.id}
    </span>
  )
})

interface FunctionLinkProps {
  title: string
  name?: string
  id: string
  icon?: string
  basePath: string
  slug: string
  isParent?: boolean
  isSubItem?: boolean
  onClick?: () => void
}

const FunctionLink = React.memo(function FunctionLink({
  title,
  id,
  icon,
  basePath,
  slug,
  isParent = false,
  isSubItem = false,
  onClick = () => {},
}: FunctionLinkProps) {
  const router = useRouter()
  const activeAccordionItem = useMenuActiveRefId()

  const url = `${router.basePath}${basePath}/${slug}`
  const active = activeAccordionItem === id

  return (
    <li className="function-link-item leading-5">
      <a
        href={url}
        /**
         * We don't actually want to navigate or re-render anything
         * since ref links are all sub-sections on the same page
         */
        onClick={(e) => {
          e.preventDefault()
          history.pushState({}, '', url)
          document.getElementById(slug)?.scrollIntoView()
          onClick()
        }}
        className={cn(
          'cursor-pointer transition text-sm hover:text-foreground gap-3 relative',
          isParent ? 'flex justify-between' : 'leading-3',
          active ? 'text-brand' : 'text-foreground-lighter'
        )}
      >
        {icon && <Image width={16} height={16} alt={icon} src={`${router.basePath}${icon}`} />}
        {title}
        {active && !isSubItem && (
          <div
            aria-hidden="true"
            className="absolute -left-[13px] top-0 bottom-0 w-[1px] bg-brand-600"
          ></div>
        )}
        {isParent && (
          <IconChevronUp
            width={16}
            className="data-open-parent:rotate-0 data-closed-parent:rotate-90 transition"
          />
        )}
      </a>
    </li>
  )
})

interface InnerLinkProps {
  item: RefMenuItem
}

const InnerLink = React.memo(function InnerLink({ item }: InnerLinkProps) {
  const router = useRouter()

  return (
    <Link
      className={cn(
        'text-sm text-foreground-lighter',
        'hover:text-foreground',
        'aria-[current]:text-brand'
      )}
      href={`/reference${item.href}`}
      onClick={(e) => {
        e.preventDefault()
        history.pushState({}, '', `${router.basePath}/reference${item.href}`)
        document.getElementById(item.slug)?.scrollIntoView()
        fireCustomEvent(e.target, DocsEvent.SIDEBAR_NAV_CHANGE, { bubbles: true })
      }}
    >
      {item.name}
    </Link>
  )
})

export interface RenderLinkProps {
  item: RefMenuItem
}

const RenderLink = React.memo(function RenderLink({ item }: RenderLinkProps) {
  const hasChildren = 'items' in item && item.items.length > 0

  return hasChildren ? <InnerLink item={item} /> : <InnerLink item={item} />
})

const SideMenuTitle = ({ title }: { title: string }) => {
  return (
    <span className="font-mono text-xs uppercase text-foreground font-medium tracking-wider">
      {title}
    </span>
  )
}

const Divider = () => {
  return <div className="h-px w-full bg-control my-3"></div>
}

interface NavigationMenuRefListItemsProps {
  id: string
  menuData: Array<RefMenuCategory>
}

const useSyncNavMenuActivity = () => {
  /**
   * Doing this imperatively means we can memoize pretty much everything
   * about the menu. This is good because ref nav menus can get very large
   * and take a while to render.
   *
   * The Custom Event is required because history is manually manipulated,
   * which means useRouter does not catch page navigations.
   */
  const { basePath } = useRouter()
  const previousPath = useRef<string>(null)
  const activeElem = useRef<HTMLAnchorElement>(null)
  const afHandle = useRef<ReturnType<typeof requestAnimationFrame>>(null)

  const elementInViewport = (elem: HTMLElement) => {
    const { top, bottom, left, right } = elem.getBoundingClientRect()
    const { innerHeight, innerWidth } = window

    const topVisible = top > 0 && top < innerHeight
    const bottomVisible = bottom > 0 && bottom < innerHeight
    const leftVisible = left > 0 && left < innerWidth
    const rightVisible = right > 0 && right < innerWidth

    return (topVisible || bottomVisible) && (leftVisible || rightVisible)
  }

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const handlePathChange = () => {
      const pathname = window.location.pathname

      if (previousPath.current !== pathname) {
        if (activeElem.current) activeElem.current.ariaCurrent = undefined
        activeElem.current = document.querySelector(`a[href="${pathname}"]`)
        if (activeElem.current) {
          activeElem.current.ariaCurrent = 'page'

          const storedElem = activeElem.current
          if (afHandle.current) cancelAnimationFrame(afHandle.current)
          afHandle.current = requestAnimationFrame(() => {
            if (!elementInViewport(storedElem)) {
              storedElem.scrollIntoView({
                behavior: prefersReducedMotion() ? 'instant' : 'smooth',
                block: 'center',
              })
            }
          })
        }

        previousPath.current = pathname
      }
    }

    // Initialize state on first navigation
    handlePathChange()

    document.addEventListener(DocsEvent.SIDEBAR_NAV_CHANGE, handlePathChange)
    return () => document.removeEventListener(DocsEvent.SIDEBAR_NAV_CHANGE, handlePathChange)
  }, [basePath])
}

const NavigationMenuRefListItems = ({ id, menuData }: NavigationMenuRefListItemsProps) => {
  const menu = NavItems[id]
  console.log(menuData)

  useSyncNavMenuActivity()

  return (
    <div className={'w-full flex flex-col gap-0 sticky top-8'}>
      <Link
        href="/"
        className={[
          'flex items-center gap-1 text-xs group mb-3',
          'text-base transition-all duration-200 text-foreground-light hover:text-brand-600 hover:cursor-pointer',
        ].join(' ')}
      >
        <div className="relative w-2">
          <div className="transition-all ease-out ml-0 group-hover:-ml-1">
            <IconChevronLeft size={10} strokeWidth={3} />
          </div>
        </div>
        <span>Back to Main Menu</span>
      </Link>
      <div className="flex items-center gap-3 my-3">
        <HomeMenuIconPicker icon={menu.icon} width={21} height={21} />
        <HeaderLink title={menu.title} url={menu.url} id={id} />
        <RevVersionDropdown />
      </div>
      <ul className="function-link-list flex flex-col gap-2 pb-5">
        {menuData.map((section) => {
          return (
            section.items.length > 0 && (
              <Fragment key={section.id}>
                {section.name === UNTITLED ? (
                  section.items.map((item) => <RenderLink key={item.id} item={item} />)
                ) : (
                  <>
                    <Divider />
                    <SideMenuTitle title={section.name} />
                    {section.items.map((item) => (
                      <RenderLink key={item.id} item={item} />
                    ))}
                  </>
                )}
              </Fragment>
            )
          )
        })}
      </ul>
    </div>
  )
}

export type { RefMenuItem, RefMenuCategory }
export { UNTITLED }
export default NavigationMenuRefListItems

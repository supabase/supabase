import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { Fragment } from 'react'
import { IconChevronDown, IconChevronLeft, cn } from 'ui'

import RevVersionDropdown from '~/components/RefVersionDropdown'
import { DocsEvent, fireCustomEvent } from '~/lib/events'
import HomeMenuIconPicker from './HomeMenuIconPicker'
import * as NavItems from './NavigationMenu.constants'
import { useGetInitialCollapsibleProps } from './utils'

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

interface InnerLinkProps {
  item: RefMenuItem
}

const InnerLink = React.memo(function InnerLink({ item, ...rest }: InnerLinkProps) {
  const router = useRouter()

  return (
    <Link
      {...rest}
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
  const { getInitialCollapsedProps, getInitialCollapsibleTriggerProps } =
    useGetInitialCollapsibleProps()

  const hasChildren = 'items' in item && item.items.length > 0

  return hasChildren ? (
    <div>
      <div className="flex justify-between">
        <InnerLink item={item} {...getInitialCollapsibleTriggerProps(item, item.items)} />
        <IconChevronDown />
      </div>
      <ul {...getInitialCollapsedProps(item)}>
        {item.items.map((child) => (
          <li key={child.id}>
            <RenderLink item={child} />
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <InnerLink item={item} />
  )
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

const NavigationMenuRefListItems = ({ id, menuData }: NavigationMenuRefListItemsProps) => {
  const menu = NavItems[id]
  console.log(menuData)

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
                    <ul>
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <RenderLink item={item} />
                        </li>
                      ))}
                    </ul>
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

'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { ChevronUp } from 'lucide-react'
import Image from 'next/legacy/image'
import { Fragment, memo } from 'react'
import { cn } from 'ui'
import RevVersionDropdown from '~/components/RefVersionDropdown'
import type { ICommonItem, ICommonSection } from '~/components/reference/Reference.types'
import { menuState, useMenuActiveRefId } from '~/hooks/useMenuState'
import { BASE_PATH } from '~/lib/constants'
import MenuIconPicker from './MenuIconPicker'
import * as NavItems from './NavigationMenu.constants'
import { deepFilterSections } from './NavigationMenu.utils'

const HeaderLink = memo(function HeaderLink(props: any) {
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

const FunctionLink = memo(function FunctionLink({
  title,
  id,
  icon,
  basePath,
  slug,
  isParent = false,
  isSubItem = false,
  onClick = () => {},
}: FunctionLinkProps) {
  const activeAccordionItem = useMenuActiveRefId()

  const url = `${BASE_PATH}${basePath}/${slug}`
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
          menuState.setMenuActiveRefId(id)
          history.pushState({}, '', url)
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          document.getElementById(slug)?.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
          })
          onClick()
        }}
        className={cn(
          'cursor-pointer transition text-sm hover:text-foreground gap-3 relative',
          isParent ? 'flex justify-between' : 'leading-3',
          active ? 'text-brand' : 'text-foreground-lighter'
        )}
      >
        {icon && <Image width={16} height={16} alt={icon} src={`${BASE_PATH}${icon}`} />}
        {title}
        {active && !isSubItem && (
          <div
            aria-hidden="true"
            className="absolute -left-[13px] top-0 bottom-0 w-[1px] bg-brand-600"
          ></div>
        )}
        {isParent && (
          <ChevronUp
            width={16}
            className="data-open-parent:rotate-0 data-closed-parent:rotate-90 transition"
          />
        )}
      </a>
    </li>
  )
})

export interface RenderLinkProps {
  section: ICommonSection
  basePath: string
}

const RenderLink = memo(function RenderLink({ section, basePath }: RenderLinkProps) {
  const activeAccordionItem = useMenuActiveRefId()

  if (!('items' in section)) {
    return (
      <FunctionLink
        title={section.title}
        id={section.id}
        slug={section.slug}
        basePath={basePath}
        isParent={false}
        isSubItem
        onClick={() => menuState.setMenuMobileOpen(false)}
      />
    )
  }

  let active =
    section.id === activeAccordionItem ||
    section.items.some((item) => item.id === activeAccordionItem)

  return (
    <Accordion.Root collapsible type="single" value={active ? section.id : ''}>
      <Accordion.Item value={section.id}>
        <FunctionLink
          title={section.title}
          id={section.id}
          slug={section.slug}
          basePath={basePath}
          isParent
          isSubItem
        />
        <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up border-l border-control pl-3 ml-1 data-open:mt-2 grid gap-2.5">
          {section.items.map((item) => {
            return (
              <FunctionLink
                key={item.id}
                title={item.title}
                id={item.id}
                slug={item.slug}
                basePath={basePath}
                isParent={false}
                isSubItem={false}
                onClick={() => menuState.setMenuMobileOpen(false)}
              />
            )
          })}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
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
  basePath: string
  commonSections: ICommonItem[]
  spec?: any
}

const NavigationMenuRefListItems = ({
  id,
  basePath,
  commonSections,
  spec,
}: NavigationMenuRefListItemsProps) => {
  const menu = NavItems[id]

  const specFunctionIds = spec?.functions.map(({ id }) => id)
  const filteredSections = spec
    ? deepFilterSections(commonSections, specFunctionIds)
    : commonSections

  return (
    <div className={'w-full flex flex-col gap-0 sticky top-8'}>
      <div className="flex items-center gap-3 my-3">
        <MenuIconPicker icon={menu.icon} width={21} height={21} />
        <HeaderLink title={menu.title} url={menu.url} id={id} />
      </div>
      <ul className="function-link-list flex flex-col gap-2 pb-5">
        {filteredSections.map((section) => {
          return (
            <Fragment key={section.title}>
              {section.type === 'category' ? (
                <>
                  <Divider />
                  <SideMenuTitle title={section.title} />
                  {section.items.map((item) => (
                    <RenderLink key={item.id} section={item} basePath={basePath} />
                  ))}
                </>
              ) : (
                <RenderLink section={section} basePath={basePath} />
              )}
            </Fragment>
          )
        })}
      </ul>
    </div>
  )
}

export default memo(NavigationMenuRefListItems)

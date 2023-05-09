import * as Accordion from '@radix-ui/react-accordion'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronLeft } from 'ui'
import * as NavItems from './NavigationMenu.constants'

import { useTheme } from 'common/Providers'
import Image from 'next/image'

import RevVersionDropdown from '~/components/RefVersionDropdown'
import { useMenuActiveRefId } from '~/hooks/useMenuState'

import React, { Fragment } from 'react'
import { ICommonItem, ICommonSection } from '~/components/reference/Reference.types'
import { deepFilterSections } from './NavigationMenu.utils'

const HeaderImage = React.memo(function HeaderImage(props: any) {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  return (
    <Image
      alt={props.icon}
      width={15}
      height={15}
      src={`${router.basePath}` + `/img/icons/menu/${props.icon}${isDarkMode ? '' : '-light'}.svg`}
    />
  )
})

const HeaderLink = React.memo(function HeaderLink(props: any) {
  const router = useRouter()

  return (
    <span className={['text-base text-brand-1200 ', !props.title && 'capitalize'].join(' ')}>
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
}

const FunctionLink = React.memo(function FunctionLink({
  title,
  id,
  icon,
  basePath,
  slug,
}: FunctionLinkProps) {
  const router = useRouter()
  const activeAccordionItem = useMenuActiveRefId()

  const url = `${router.basePath}${basePath}/${slug}`
  const active = activeAccordionItem === id

  return (
    <li className="function-link-item">
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
        }}
        className={[
          'cursor-pointer transition text-sm hover:text-brand-900 flex gap-3',
          active ? 'text-brand-900' : 'text-scale-1000',
        ].join(' ')}
      >
        {icon && <Image width={16} height={16} alt={icon} src={`${router.basePath}${icon}`} />}
        {title}
      </a>
    </li>
  )
})

export interface RenderLinkProps {
  section: ICommonSection
  basePath: string
}

const RenderLink = React.memo(function RenderLink({ section, basePath }: RenderLinkProps) {
  const activeAccordionItem = useMenuActiveRefId()

  if (!('items' in section)) {
    return (
      <FunctionLink title={section.title} id={section.id} slug={section.slug} basePath={basePath} />
    )
  }

  let active =
    section.id === activeAccordionItem ||
    section.items.some((item) => item.id === activeAccordionItem)

  return (
    <>
      <FunctionLink title={section.title} id={section.id} slug={section.slug} basePath={basePath} />
      <Accordion.Root collapsible type="single" value={active ? section.id : ''}>
        <Accordion.Item value={section.id}>
          <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up ml-2">
            {section.items.map((item) => {
              return (
                <FunctionLink
                  key={item.id}
                  title={item.title}
                  id={item.id}
                  slug={item.slug}
                  basePath={basePath}
                />
              )
            })}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </>
  )
})

const SideMenuTitle = ({ title }: { title: string }) => {
  return (
    <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider">
      {title}
    </span>
  )
}

const Divider = () => {
  return <div className="h-px w-full bg-blackA-300 dark:bg-whiteA-300 my-3"></div>
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
      <Link href="/" passHref>
        <a
          className={[
            'flex items-center gap-1 text-xs group mb-3',
            'text-base transition-all duration-200 text-scale-1100 hover:text-brand-1200 hover:cursor-pointer ',
          ].join(' ')}
        >
          <div className="relative w-2">
            <div className="transition-all ease-out ml-0 group-hover:-ml-1">
              <IconChevronLeft size={10} strokeWidth={3} />
            </div>
          </div>
          <span>Back to Main Menu</span>
        </a>
      </Link>
      <div className="flex items-center gap-3 my-3">
        <HeaderImage icon={menu.icon} />
        <HeaderLink title={menu.title} url={menu.url} id={id} />
        <RevVersionDropdown />
      </div>
      <ul className="function-link-list flex flex-col gap-1">
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

export default React.memo(NavigationMenuRefListItems)

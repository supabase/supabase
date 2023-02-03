import * as Accordion from '@radix-ui/react-accordion'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronLeft } from 'ui'
import * as NavItems from './NavigationMenu.constants'

import { find } from 'lodash'
import Image from 'next/image'
import { useTheme } from 'common/Providers'

import RevVersionDropdown from '~/components/RefVersionDropdown'
import { useMenuActiveRefId } from '~/hooks/useMenuState'
import { RefIdOptions, RefKeyOptions } from './NavigationMenu'

import React, { Fragment } from 'react'
import { generateAllowedClientLibKeys } from '~/lib/refGenerator/helpers'
import { isFuncNotInLibraryOrVersion } from './NavigationMenu.utils'

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

const FunctionLink = React.memo(function FunctionLink({
  title,
  id,
  icon,
  library,
  slug,
}: {
  title: string
  name?: string
  id: string
  icon?: string
  product?: string
  library: string
  slug: string
}) {
  const router = useRouter()
  const activeAccordianItem = useMenuActiveRefId()

  // check if we're on a versioned page
  let version = ''
  if (router.asPath.includes('v1')) {
    version = 'v1'
  }

  if (router.asPath.includes('v0')) {
    version = 'v0'
  }

  const active = activeAccordianItem === id
  return (
    <li key={id} className="function-link-item">
      <Link href={`/reference/${library}/${version ? version + '/' : ''}${slug}`} passHref>
        <a
          className={[
            'cursor-pointer transition text-sm hover:text-brand-900 flex gap-3',
            active ? 'text-brand-900' : 'text-scale-1000',
          ].join(' ')}
        >
          {icon && <Image width={16} height={16} alt={icon} src={`${router.basePath}${icon}`} />}
          {title}
        </a>
      </Link>
    </li>
  )
})

const RenderLink = React.memo(function RenderLink(props: any) {
  const activeAccordianItem = useMenuActiveRefId()
  let active = false

  const isFilter = props.filterIds?.includes(activeAccordianItem)
  const isModifier = props.modifierIds?.includes(activeAccordianItem)
  const isAuthServer = props.authServerIds?.includes(activeAccordianItem)

  if (
    (isFilter && props.id === 'using-filters') ||
    (activeAccordianItem === 'using-filters' && props.id === 'using-filters')
  ) {
    active = true
  } else if (
    (isModifier && props.id === 'using-modifiers') ||
    (activeAccordianItem === 'using-modifiers' && props.id === 'using-modifiers')
  ) {
    active = true
  } else if (
    (isAuthServer && props.id === 'admin-api') ||
    (activeAccordianItem === 'admin-api' && props.id === 'admin-api')
  ) {
    active = true
  } else {
    active = false
  }

  return (
    <Accordion.Root
      collapsible
      key={props.id + '-accordian-root-for-func-' + props.index}
      type="single"
      value={active ? props.id : ''}
    >
      <Accordion.Item key={props.id + '-accordian-item'} value={props.id}>
        <FunctionLink library={props.lib} title={props.title} id={props.id} slug={props.slug} />
        <Accordion.Content
          key={props.id + '-sub-items-accordion-container'}
          className="transition data-open:animate-slide-down data-closed:animate-slide-up ml-2"
        >
          {props.items &&
            props.items
              .filter((item) => props.allowedKeys.includes(item.id))
              .map((item) => {
                return (
                  <FunctionLink
                    key={item.title}
                    library={props.lib}
                    title={item.title}
                    id={item.id}
                    slug={item.slug}
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
    <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider">
      {title}
    </span>
  )
}

const Divider = () => {
  return <div className="h-px w-full bg-blackA-300 dark:bg-whiteA-300 my-3"></div>
}

interface INavigationMenuRefList {
  id: RefIdOptions
  lib: RefKeyOptions
  commonSections: any[] // to do type up

  // the keys of menu items that are allowed to be shown on the side menu
  // if undefined, we show all the menu items
  allowedClientKeys?: string[]
  spec?: any
}

const Content: React.FC<INavigationMenuRefList> = ({ id, lib, commonSections, spec }) => {
  const allowedClientKeys = spec ? generateAllowedClientLibKeys(commonSections, spec) : undefined

  let sections = commonSections

  const allowedKeys = allowedClientKeys

  if (!sections) console.error('no common sections imported')

  const menu = NavItems[id]
  const databaseFunctions = find(sections, { title: 'Database' })
    ? find(sections, { title: 'Database' }).items
    : []

  const authFunctions = find(sections, { title: 'Auth' })
    ? find(sections, { title: 'Auth' }).items
    : []

  const filterIds =
    databaseFunctions.length > 0
      ? find(databaseFunctions, {
          id: 'using-filters',
        }) &&
        find(databaseFunctions, {
          id: 'using-filters',
        })
          .items.filter((x) => allowedKeys.includes(x.id))
          .map((x) => x.id)
      : []
  const modifierIds =
    databaseFunctions.length > 0
      ? find(databaseFunctions, {
          id: 'using-modifiers',
        }) &&
        find(databaseFunctions, {
          id: 'using-modifiers',
        })
          .items.filter((x) => allowedKeys.includes(x.id))
          .map((x) => x.id)
      : []

  const authServerIds =
    databaseFunctions.length > 0
      ? find(authFunctions, {
          id: 'admin-api',
        }) &&
        find(authFunctions, {
          id: 'admin-api',
        }).items.map((x) => x.id)
      : []

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
        {sections.map((fn: any, fnIndex) => {
          // run allow check
          if (isFuncNotInLibraryOrVersion(fn.id, fn.type, allowedKeys)) {
            return <Fragment key={fn.id}></Fragment>
          }

          // handle subtitles with subitems
          return fn.id ? (
            <Fragment key={fn.id}>
              <RenderLink {...fn} lib={lib} />
              {fn.items &&
                fn.items.map((item) => (
                  <RenderLink
                    {...item}
                    library={menu.title}
                    index={fnIndex}
                    modifierIds={modifierIds}
                    filterIds={filterIds}
                    authServerIds={authServerIds}
                    lib={lib}
                    allowedKeys={allowedKeys}
                  />
                ))}
            </Fragment>
          ) : (
            <Fragment key={fn.title}>
              <Divider />
              <SideMenuTitle title={fn.title} />
              {fn.items &&
                fn.items.map((item, i) => {
                  // run allow check
                  if (isFuncNotInLibraryOrVersion(item.id, item.type, allowedKeys))
                    return <Fragment key={item.id + i}></Fragment>
                  return (
                    <RenderLink
                      {...item}
                      key={item.id + i}
                      library={menu.title}
                      index={fnIndex}
                      modifierIds={modifierIds}
                      filterIds={filterIds}
                      authServerIds={authServerIds}
                      lib={lib}
                      allowedKeys={allowedKeys}
                    />
                  )
                })}
            </Fragment>
          )
        })}
      </ul>
    </div>
  )
}

export default React.memo(Content)

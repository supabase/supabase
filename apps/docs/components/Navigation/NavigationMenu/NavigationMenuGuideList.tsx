import * as Accordion from '@radix-ui/react-accordion'
import { useTheme } from 'common/Providers'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { Fragment } from 'react'
import { IconChevronLeft } from '~/../../packages/ui'
import { useMenuLevelId } from '~/hooks/useMenuState'
import * as NavItems from './NavigationMenu.constants'

interface Props {
  id: string
  setMenuLevelId?: any
  context: 'side' | 'mobile'
}
const NavigationMenuGuideList: React.FC<Props> = ({ id, setMenuLevelId, context }) => {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  const menu = NavItems[id]

  //console.log(id, 'url is:', menu.url)

  // get url
  const url = router.asPath
  // remove the end of the url if a deep link
  const firstLevelRoute = url?.split('/')?.slice(0, 4)?.join('/')

  const level = useMenuLevelId()

  return (
    <Accordion.Root
      collapsible
      key={id + context}
      type="single"
      value={firstLevelRoute}
      className={[
        'transition-all ml-8 duration-150 ease-out',
        // enabled
        level === id && 'opacity-100 ml-0 delay-150',
        level === 'home' && 'ml-12',

        // disabled
        level !== 'home' && level !== id ? '-ml-8' : '',
        level !== id ? 'opacity-0 invisible absolute' : '',
      ].join(' ')}
    >
      <ul className={['relative w-full flex flex-col gap-0'].join(' ')}>
        <Link href={`${menu.parent ?? '/'}`} passHref>
          <a
            className={[
              'flex items-center gap-1 text-xs group mb-3',
              'text-base transition-all duration-200 text-brand-900 hover:text-brand-1200 hover:cursor-pointer ',
            ].join(' ')}
          >
            <div className="relative w-2">
              <div className="transition-all ease-out ml-0 group-hover:-ml-1">
                <IconChevronLeft size={10} strokeWidth={3} />
              </div>
            </div>
            <span>Back to Home</span>
          </a>
        </Link>

        <Link href={menu.url ?? ''} passHref>
          <a>
            <div className="flex items-center gap-3 my-3">
              <Image
                alt={menu.icon}
                width={15}
                height={15}
                src={
                  `${router.basePath}` +
                  `/img/icons/menu/${menu.icon}${isDarkMode ? '' : '-light'}.svg`
                }
              />
              <span
                className={[
                  ' ',
                  !menu.title && 'capitalize',
                  menu.url === router.pathname
                    ? 'text-brand-900'
                    : 'hover:text-brand-900 text-scale-1200',
                ].join(' ')}
              >
                {menu.title ?? level}
              </span>
            </div>
          </a>
        </Link>

        {menu.items.map((x, index) => {
          // console.log('1st type of link?', x.items && x.items.length > 0)
          // console.log()
          return (
            <div key={x.name + context}>
              {x.items && x.items.length > 0 ? (
                <div>
                  {x.items.map((subItem, subItemIndex) => {
                    // console.log('subitem', { subItem })
                    // console.log('router', router)
                    //console.log('subitem url', subItem.url)
                    let subItemMenuOpen = false

                    if (router.asPath.includes(subItem.url)) {
                      subItemMenuOpen = true
                    }

                    const LinkContainer = (props) => {
                      return (
                        <Link href={props.url} passHref>
                          <a className={props.className}>{props.children}</a>
                        </Link>
                      )
                    }

                    return (
                      <Fragment key={x.name + context + subItemIndex}>
                        {subItemIndex === 0 && (
                          <>
                            <div className="h-px w-full bg-green-500 my-3"></div>
                            <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider">
                              {x.name}
                            </span>
                          </>
                        )}
                        <Accordion.Item key={subItem.label + context} value={subItem.url}>
                          <li key={subItem.name + context}>
                            <LinkContainer
                              url={subItem.url}
                              className={[
                                'flex items-center gap-2',
                                'cursor-pointer transition text-sm',
                                subItem.url === router.pathname
                                  ? 'text-brand-900'
                                  : 'hover:text-brand-900 text-scale-1000',
                              ].join(' ')}
                              parent={subItem.parent}
                            >
                              {subItem.icon && (
                                <Image
                                  alt={subItem.name + router.basePath}
                                  src={
                                    `${router.basePath}` +
                                    `${subItem.icon}${!isDarkMode ? '-light' : ''}.svg`
                                  }
                                  width={15}
                                  height={15}
                                />
                              )}
                              {subItem.name}
                            </LinkContainer>
                          </li>

                          {subItem.items && subItem.items.length > 0 && (
                            <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up ml-2">
                              {subItem.items.map((subSubItem, subSubItemIndex) => {
                                return (
                                  <li key={subItem.name + context}>
                                    <Link href={`${subSubItem.url}`} passHref>
                                      <a
                                        className={[
                                          'cursor-pointer transition text-sm',
                                          subSubItem.url === router.pathname
                                            ? 'text-brand-900'
                                            : 'hover:text-brand-900 text-scale-1000',
                                        ].join(' ')}
                                      >
                                        {subSubItem.name}
                                      </a>
                                    </Link>
                                  </li>
                                )
                              })}
                            </Accordion.Content>
                          )}
                        </Accordion.Item>
                      </Fragment>
                    )
                  })}
                </div>
              ) : (
                <Fragment key={x.url + context}>
                  <li>
                    <Link href={`${x.url}`} passHref>
                      <a
                        className={[
                          'cursor-pointer transition text-sm',
                          x.url === router.pathname
                            ? 'text-brand-900'
                            : 'hover:text-brand-900 text-scale-1000',
                        ].join(' ')}
                      >
                        {x.icon && (
                          <Image
                            width={12}
                            height={12}
                            alt={x.icon}
                            src={`${router.basePath}${x.icon}`}
                          />
                        )}

                        {x.name}
                      </a>
                    </Link>
                  </li>
                </Fragment>
              )}
            </div>
          )
        })}
        {menu.extras && (
          <>
            <div className="h-px w-full bg-green-500 my-3"></div>
            <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider mb-2">
              Resources
            </span>
          </>
        )}
        {menu.extras?.map((x) => {
          return (
            <div key={x.name + context}>
              <li>
                <Link href={`${x.href}`} passHref>
                  <a className="cursor-pointer transition text-scale-1100 text-sm hover:text-brand-900 flex gap-3 my-1">
                    {x.icon && (
                      <Image
                        width={15}
                        height={15}
                        alt={x.icon}
                        src={`${router.basePath}${x.icon}`}
                      />
                    )}
                    {x.name}
                  </a>
                </Link>
              </li>
            </div>
          )
        })}
      </ul>
    </Accordion.Root>
  )
}

export default NavigationMenuGuideList

import Link from 'next/link'
import { useRouter } from 'next/router'
import rehypeFilter from 'react-markdown/lib/rehype-filter'
import { IconChevronLeft } from '~/../../packages/ui'
import * as NavItems from './NavigationMenu.constants'
import * as Accordion from '@radix-ui/react-accordion'
import { useEffect } from 'react'

const NavigationMenuGuideList = ({ currentLevel, setLevel, id }) => {
  const router = useRouter()

  const menu = NavItems[id]

  // get url
  const url = router.asPath
  // remove the end of the url if a deep link
  const firstLevelRoute = url?.split('/')?.slice(0, 4)?.join('/')

  return (
    <Accordion.Root
      collapsible
      key={id}
      type="single"
      className="space-y-0.5"
      value={firstLevelRoute}
    >
      <div
        className={[
          'transition-all ml-8 duration-150 ease-out',

          // enabled
          currentLevel === id && 'opacity-100 ml-0 delay-150',
          currentLevel === 'home' && 'ml-12',

          // disabled
          currentLevel !== 'home' && currentLevel !== id ? '-ml-8' : '',
          currentLevel !== id ? 'opacity-0 invisible absolute' : '',
        ].join(' ')}
      >
        <ul className={'relative w-full flex flex-col gap-0'}>
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

          <div
            className="flex items-center gap-3 my-3

        invisible md:visible"
          >
            {/* <div className="w-10 h-10 bg-brand-500 rounded flex items-center justify-center"> */}
            <img
              src={`${router.basePath}` + menu.icon ?? `/img/icons/menu/${id}.svg`}
              className="w-5 rounded"
            />
            {/* </div> */}
            <h2
              className={[
                ' ',
                !menu.title && 'capitalize',
                id === router.pathname ? 'text-brand-900' : 'hover:text-brand-900 text-scale-1200',
              ].join(' ')}
            >
              {menu.title ?? currentLevel}
            </h2>
          </div>

          {menu.items.map((x, index) => {
            // console.log('1st type of link?', x.items && x.items.length > 0)
            // console.log()
            return (
              <div key={x.url}>
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

                      return (
                        <>
                          {subItemIndex === 0 && (
                            <>
                              <div className="h-px w-full bg-green-500 my-3"></div>
                              <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider">
                                {x.name}
                              </span>
                            </>
                          )}
                          <Accordion.Item key={subItem.label} value={subItem.url}>
                            <li key={subItem.name}>
                              <Link href={`/${subItem.url}`} passHref>
                                <a
                                  className={[
                                    'cursor-pointer transition text-sm',
                                    subItem.url === router.pathname
                                      ? 'text-brand-900'
                                      : 'hover:text-brand-900 text-scale-1000',
                                  ].join(' ')}
                                >
                                  {subItem.name}
                                </a>
                              </Link>
                            </li>

                            {subItem.items && subItem.items.length > 0 && (
                              <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up ml-2">
                                {subItem.items.map((subSubItem, subSubItemIndex) => {
                                  return (
                                    <li key={subItem.name}>
                                      <Link href={`/${subSubItem.url}`} passHref>
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
                        </>
                      )
                    })}
                  </div>
                ) : (
                  <>
                    <li>
                      <Link href={`/${x.url}`} passHref>
                        <a
                          className={[
                            'cursor-pointer transition text-sm',
                            x.url === router.pathname
                              ? 'text-brand-900'
                              : 'hover:text-brand-900 text-scale-1000',
                          ].join(' ')}
                        >
                          {x.icon && <img className="w-3" src={`${router.basePath}${x.icon}`} />}
                          {x.name}
                        </a>
                      </Link>
                    </li>
                  </>
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
              <div key={x.name}>
                <li>
                  <Link href={`/${x.href}`} passHref>
                    <a className="cursor-pointer transition text-scale-1100 text-sm hover:text-brand-900 flex gap-3 my-1">
                      {x.icon && <img className="w-4" src={`${router.basePath}${x.icon}`} />}
                      {x.name}
                    </a>
                  </Link>
                </li>
              </div>
            )
          })}
        </ul>
      </div>
    </Accordion.Root>
  )
}

export default NavigationMenuGuideList

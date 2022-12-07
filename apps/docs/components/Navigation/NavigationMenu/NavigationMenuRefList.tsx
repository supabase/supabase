import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronLeft } from 'ui'
import * as NavItems from './NavigationMenu.constants'
import * as Accordion from '@radix-ui/react-accordion'

import Image from 'next/image'
import clientLibsCommonSections from '~/../../spec/common-client-libs-sections.json'
import { useEffect, useState, memo } from 'react'
import useWindowLocation from '~/hooks/useWindowLocation'
import { useNavigationMenuContext } from './NavigationMenu.Context'
import { find } from 'lodash'
import { useMenuActiveRefId } from '~/hooks/useMenuState'

const allFunctions = Object.values(clientLibsCommonSections.sections.functions)

const FunctionLink = ({
  title,
  id,
  icon,
  product,
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
}) => {
  const router = useRouter()
  // const { activeRefItem } = useNavigationMenuContext()
  const activeAccordianItem = useMenuActiveRefId()

  const active = activeAccordianItem === id
  return (
    <li key={id} className="function-link-item">
      <Link href={`/reference/${library}/${slug}`} passHref>
        <a
          className={[
            'cursor-pointer transition text-sm hover:text-brand-900 flex gap-3',
            active ? 'text-brand-900' : 'text-scale-1000',
          ].join(' ')}
        >
          {icon && <img className="w-3" src={`${router.basePath}${icon}`} />}
          {title}
        </a>
      </Link>
    </li>
  )
}

const SideMenuTitle = ({ title }: { title: string }) => {
  return (
    <span className="font-mono text-xs uppercase text-scale-1200 font-medium tracking-wider mb-3">
      {title}
    </span>
  )
}

const Divider = () => {
  return <div className="h-px w-full bg-blackA-300 dark:bg-whiteA-300 my-3"></div>
}

const NavigationMenuRefList = ({ currentLevel, setLevel, id, lib }) => {
  const router = useRouter()
  // const { activeRefItem } = useNavigationMenuContext()
  // const [activeAccordianItem, setActiveAccordianItem] = useState('')

  // const activeRefItem = useMenuActiveRefId()

  // Get only the functions with references in the current librarry
  // ie: if the lib === dart, only get the dart functions

  const allCurrentFunctions = allFunctions
    .map((fn: any) => {
      if (fn.items.flat().find((item) => item.libs.includes(lib))) return fn
    })
    .filter((item) => item)

  const introItems = Object.values(clientLibsCommonSections.sections.intro[lib].items)

  const menu = NavItems[id]

  const url = router.asPath

  const firstLevelRoute = url?.split('/')?.slice(0, 4)?.join('/')

  const path = useWindowLocation()

  useEffect(() => {
    console.log('path', path)
  }, [path])

  // console.log('firstLevelRoute', firstLevelRoute)

  // console.log('allFunctions', allFunctions)

  const databaseFunctions = find(allFunctions, { title: 'Database' }).items

  const filterIds = find(databaseFunctions, {
    id: 'using-filters',
  }).items.map((x) => x.id)

  const modifierIds = find(databaseFunctions, {
    id: 'using-modifiers',
  }).items.map((x) => x.id)

  // console.log(filterIds, modifierIds)

  // console.log(filterIds.includes(activeRefItem) ? 'test IS FILTER' : 'test NOT FIlTER')

  // useEffect(() => {
  //   console.log('activeAccordianItem in USEEFFECT', activeAccordianItem)

  //   if (filterIds.includes(activeRefItem) || activeRefItem === 'using-filters') {
  //     console.log('FILTERS')
  //     setActiveAccordianItem('using-filters')
  //   } else if (modifierIds.includes(activeRefItem) || activeRefItem === 'using-modifiers') {
  //     console.log('MODIFIERS')
  //     setActiveAccordianItem('using-modifiers')
  //   } else {
  //     setActiveAccordianItem('')
  //   }
  // }, [activeRefItem])

  // console.log('filterIds', filterIds)
  // console.log('modifierIds', modifierIds)

  return (
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
      <Accordion.Root collapsible key={id} type="single">
        <Accordion.Item value={'1'}>
          <Accordion.AccordionTrigger>
            <button>open</button>
          </Accordion.AccordionTrigger>

          <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up ml-2">
            <h1 className="text-4xl text-indigo-900">hello world</h1>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <div className={'w-full flex flex-col gap-0 sticky top-8'}>
        {/* {process.env.NEXT_PUBLIC_EXPERIMENTAL_REF !== 'true' && ( */}
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
        {/* )} */}
        {/* {process.env.NEXT_PUBLIC_EXPERIMENTAL_REF !== 'true' && ( */}
        <div className="flex items-center gap-3 my-3">
          <Image
            alt={id}
            width={24}
            height={24}
            src={`${router.basePath}` + menu.icon ?? `/img/icons/menu/${id}.svg`}
            className="rounded"
          />
          <h2
            className={['font-mono text-sm text-brand-1200 ', !menu.title && 'capitalize'].join(
              ' '
            )}
          >
            {menu.title}
          </h2>
        </div>
        {/* )} */}

        <ul className="function-link-list">
          {introItems.map((item: any) => (
            <FunctionLink {...item} library={menu.title} />
          ))}

          <Divider />

          {allCurrentFunctions.map((fn: any) => {
            const toplevelItems = fn.items.filter((item) => !item.parent)
            toplevelItems.map((item) => <li>{item.title}</li>)

            const RenderLink = (props) => {
              const activeAccordianItem = useMenuActiveRefId()
              let active = false

              console.log('render link id', props.id)

              const isFilter = filterIds.includes(activeAccordianItem)
              const isModifier = modifierIds.includes(activeAccordianItem)

              if (
                (isFilter && !isModifier && props.id === 'using-filters') ||
                activeAccordianItem === 'using-filters'
              ) {
                active = true
              } else if (
                (isModifier && !isFilter && props.id === 'using-modifiers') ||
                activeAccordianItem === 'using-modifiers'
              ) {
                active = true
              } else {
                active = false
              }

              return (
                <Accordion.Root
                  collapsible
                  key={props.id + 'accordian-root-for-func'}
                  type="single"
                  value={active ? props.id : ''}
                >
                  <Accordion.Item key={props.id + '-accordian-item'} value={props.id}>
                    <FunctionLink {...props} library={props.library} />
                    <Accordion.Content
                      key={props.id + '-sub-items-accordion-container'}
                      className="transition data-open:animate-slide-down data-closed:animate-slide-up ml-2"
                    >
                      {props.items &&
                        props.items
                          .filter((item) => item.libs.includes(lib))
                          .map((item) => {
                            return <FunctionLink {...item} library={menu.title} />
                          })}
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              )
            }

            return (
              <>
                <Divider />
                <SideMenuTitle title={fn.title} />
                {fn.items
                  .filter((item) => item.libs.includes(lib))
                  .map((item) => (
                    <RenderLink {...item} library={menu.title} />
                  ))}
              </>
            )
          })}
        </ul>
        {menu.extras && (
          <>
            <Divider />{' '}
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
                    {x.icon && (
                      <Image
                        alt={x.icon}
                        width={20}
                        height={20}
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
      </div>
    </div>
  )
}

export default memo(NavigationMenuRefList)

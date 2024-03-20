import * as Accordion from '@radix-ui/react-accordion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type PropsWithChildren, memo } from 'react'

import { IconChevronLeft, cn } from 'ui'

import HomeMenuIconPicker from './HomeMenuIconPicker'
import { type MenuId } from './NavigationMenu'
import * as NavItems from './NavigationMenu.constants'
import { useNavMenu } from './NavigationMenuContext'
import NavigationMenuGuideListItems from './NavigationMenuGuideListItems'
import { type GuideRefItem } from './NavigationMenuGuideRef'

export const HeaderLink = memo(function HeaderLink(props: {
  id: MenuId
  title: string
  url: string
}) {
  const pathname = usePathname()

  return (
    <span
      className={[
        ' ',
        !props.title && 'capitalize',
        props.url === pathname ? 'text-brand' : 'hover:text-brand text-foreground',
      ].join(' ')}
    >
      {props.title ?? props.id}
    </span>
  )
})

interface Props {
  id: MenuId
  collapsible?: boolean
  refData?: Array<GuideRefItem>
  value?: string[]
}

type MenuContents = 'guide' | 'ref'

const NavigationMenuGuideList: React.FC<Props> = ({ id, refData, value }) => {
  const { dualMenu } = useNavMenu()
  const url = usePathname()

  const menu = NavItems[id]

  // We need to decide how deep we want the menu to be for matching urls
  // if the links are really deep, we don't want to match all the way out
  // But we need to reach out further to make the structure of  /resources/postgres/  work
  // look at /resources/postgres/  vs /auth/phone-login for how these are different
  let firstLevelRoute
  if (url.includes('resources/postgres/')) {
    firstLevelRoute = url?.split('/')?.slice(0, 5)?.join('/')
  } else {
    firstLevelRoute = url?.split('/')?.slice(0, 4)?.join('/')
  }

  if (!dualMenu) {
    return (
      <div className="w-full flex flex-col">
        <Link
          href={`${menu.parent ?? '/'}`}
          className={[
            'flex items-center gap-1 text-xs group mb-3',
            'text-base transition-all duration-200 text-brand-link hover:text-brand-600 hover:cursor-pointer ',
          ].join(' ')}
        >
          <div className="relative w-2">
            <div className="transition-all ease-out ml-0 group-hover:-ml-1">
              <IconChevronLeft size={10} strokeWidth={3} />
            </div>
          </div>
          <span>Back to Home</span>
        </Link>

        <Link href={menu.url ?? ''}>
          <div className="flex items-center gap-3 my-3 text-brand-link">
            <HomeMenuIconPicker icon={menu.icon} />
            <HeaderLink title={menu.title} url={menu.url} id={id} />
          </div>
        </Link>

        <Accordion.Root
          collapsible={true}
          key={id}
          type={value ? 'multiple' : 'single'}
          value={value ?? firstLevelRoute}
          className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150"
        >
          <NavigationMenuGuideListItems menu={menu} id={id} />
        </Accordion.Root>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col">
      <Link
        href={`${menu.parent ?? '/'}`}
        className={[
          'flex items-center gap-1 text-xs group mb-3',
          'text-base transition-all duration-200 text-brand-link hover:text-brand-600 hover:cursor-pointer ',
        ].join(' ')}
      >
        <div className="relative w-2">
          <div className="transition-all ease-out ml-0 group-hover:-ml-1">
            <IconChevronLeft size={10} strokeWidth={3} />
          </div>
        </div>
        <span>Back to Home</span>
      </Link>

      <Link href={menu.url ?? ''}>
        <div className="flex items-center gap-3 my-3 text-brand-link">
          <HomeMenuIconPicker icon={menu.icon} />
          <HeaderLink title={menu.title} url={menu.url} id={id} />
        </div>
      </Link>
      <div className="flex gap-4 mt-4 mb-6 border-b border-brand-200">
        <TabLink href="#" active>
          Guides
        </TabLink>
        <TabLink href="/reference/auth/javascript">API</TabLink>
      </div>
      <Accordion.Root
        collapsible={true}
        key={id}
        type={value ? 'multiple' : 'single'}
        value={value ?? firstLevelRoute}
        className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150"
      >
        <NavigationMenuGuideListItems menu={menu} id={id} />
      </Accordion.Root>
    </div>
  )
}

/**
 * A link styled to look like a tab.
 */
export const TabLink = ({
  children,
  href,
  active = false,
  className,
}: PropsWithChildren<{ href: string; active?: boolean; className?: string }>) => (
  <Link
    href={href}
    className={cn(
      'relative',
      'pb-2',
      active && 'text-brand',
      active &&
        'after:absolute after:bottom-[-1px] after:left-0 after:h-1 after:w-full after:bg-brand-200',
      className
    )}
    aria-current={active ? 'page' : undefined}
  >
    {children}
  </Link>
)

export default NavigationMenuGuideList

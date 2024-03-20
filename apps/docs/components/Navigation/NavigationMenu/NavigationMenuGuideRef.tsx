import Link from 'next/link'

import { IconChevronLeft } from 'ui'

import { type MenuId } from './menus'
import HomeMenuIconPicker from './HomeMenuIconPicker'
import * as NavItems from './NavigationMenu.constants'
import { HeaderLink, TabLink } from './NavigationMenuGuideList'

type GuideRefItem = { id: string; title: string; libraries: Array<string> }

const NavigationMenuGuideRef = ({ id, refData }: { id: MenuId; refData: Array<GuideRefItem> }) => {
  const menu = NavItems[id]

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
        <TabLink href="#">Guides</TabLink>
        <TabLink href="/reference/auth/javascript" active>
          API
        </TabLink>
      </div>
      <pre>{JSON.stringify(refData, null, 2)}</pre>
    </div>
  )
}

export type { GuideRefItem }
export { NavigationMenuGuideRef }

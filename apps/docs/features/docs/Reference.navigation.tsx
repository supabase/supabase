import { Fragment, type PropsWithChildren } from 'react'

import { cn } from 'ui'

import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import RefVersionDropdown from '~/components/RefVersionDropdown'
import {
  RefLink,
  ReferenceNavigationScrollHandler,
} from '~/features/docs/Reference.navigation.client'
import {
  genClientSdkSectionTree,
  type AbbrevCommonClientLibSection,
} from '~/features/docs/Reference.utils'

interface ClientSdkNavigationProps {
  name: string
  menuData: { icon?: string }
  libPath: string
  version: string
  specFile: string
  excludeName: string
  isLatestVersion: boolean
  isCrawlerPage?: boolean
}

async function ClientSdkNavigation({
  name,
  menuData,
  libPath,
  version,
  specFile,
  excludeName,
  isLatestVersion,
  isCrawlerPage = false,
}: ClientSdkNavigationProps) {
  const navSections = await genClientSdkSectionTree(specFile, excludeName)

  const basePath = `/reference/${libPath}${isLatestVersion ? '' : `/${version}`}`

  return (
    <ReferenceNavigationScrollHandler className="w-full flex flex-col pt-3 pb-5 gap-3">
      <div className="flex items-center gap-3">
        {'icon' in menuData && <MenuIconPicker icon={menuData.icon} width={21} height={21} />}
        <span className="text-base text-brand-600">{name}</span>
        <RefVersionDropdown
          library={libPath}
          currentVersion={version}
          isLatestVersion={isLatestVersion}
        />
      </div>
      <ul className="flex flex-col gap-2">
        {navSections.map((section) => (
          <Fragment key={section.id}>
            {section.type === 'category' ? (
              <li>
                <RefCategory basePath={basePath} section={section} isCrawlerPage={isCrawlerPage} />
              </li>
            ) : (
              <li className={topLvlRefNavItemStyles}>
                <RefLink basePath={basePath} section={section} isCrawlerPage={isCrawlerPage} />
              </li>
            )}
          </Fragment>
        ))}
      </ul>
    </ReferenceNavigationScrollHandler>
  )
}

const topLvlRefNavItemStyles = 'leading-5'

function RefCategory({
  basePath,
  section,
  isCrawlerPage = false,
}: {
  basePath: string
  section: AbbrevCommonClientLibSection
  isCrawlerPage?: boolean
}) {
  if (!('items' in section && section.items.length > 0)) return null

  return (
    <>
      <Divider />
      {'title' in section && <SideMenuTitle className="py-2">{section.title}</SideMenuTitle>}
      <ul className="space-y-2">
        {section.items.map((item) => (
          <li key={item.id} className={topLvlRefNavItemStyles}>
            <RefLink basePath={basePath} section={item} isCrawlerPage={isCrawlerPage} />
          </li>
        ))}
      </ul>
    </>
  )
}

function Divider() {
  return <hr className="w-full h-px my-3 bg-control" />
}

function SideMenuTitle({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'font-mono font-medium text-xs text-foreground tracking-wider uppercase',
        className
      )}
    >
      {children}
    </div>
  )
}

export { ClientSdkNavigation }
export type { AbbrevCommonClientLibSection }

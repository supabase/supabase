import { Fragment, type PropsWithChildren } from 'react'

import { cn } from 'ui'

import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import RefVersionDropdown from '~/components/RefVersionDropdown'
import { getReferenceSections } from '~/features/docs/Reference.generated.singleton'
import {
  RefLink,
  ReferenceNavigationScrollHandler,
} from '~/features/docs/Reference.navigation.client'
import { type AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'

interface ReferenceNavigationProps {
  libraryId: string
  name: string
  menuData: { icon?: string }
  libPath: string
  version: string
  isLatestVersion: boolean
}

export async function ReferenceNavigation({
  libraryId,
  name,
  menuData,
  libPath,
  version,
  isLatestVersion,
}: ReferenceNavigationProps) {
  console.log('[Enter] ReferenceNavigation')
  const navSections = await getReferenceSections(libraryId, version)

  const basePath = `/reference/${libPath}${isLatestVersion ? '' : `/${version}`}`

  console.log('[PreReturn] ReferenceNavigation')
  return (
    <ReferenceNavigationScrollHandler className="w-full flex flex-col pt-3 pb-5 gap-3">
      <div className="flex items-center gap-3">
        {'icon' in menuData && <MenuIconPicker icon={menuData.icon} width={21} height={21} />}
        <span className="text-base text-brand-600">{name}</span>
        <RefVersionDropdown library={libPath} currentVersion={version} />
      </div>
      <ul className="flex flex-col gap-2">
        {navSections.map((section) => (
          <Fragment key={section.id}>
            {section.type === 'category' ? (
              <li>
                <RefCategory basePath={basePath} section={section} />
              </li>
            ) : (
              <li className={topLvlRefNavItemStyles}>
                <RefLink basePath={basePath} section={section} />
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
}: {
  basePath: string
  section: AbbrevApiReferenceSection
}) {
  if (!('items' in section && section.items.length > 0)) return null

  return (
    <>
      <Divider />
      {'title' in section && <SideMenuTitle className="py-2">{section.title}</SideMenuTitle>}
      <ul className="space-y-2">
        {section.items.map((item) => (
          <li key={item.id} className={topLvlRefNavItemStyles}>
            <RefLink basePath={basePath} section={item} />
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

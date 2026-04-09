import { isFeatureEnabled } from 'common'
import { type PropsWithChildren } from 'react'

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
  // libraryId: string
  name: string
  icon: string
  // menuData: { icon?: string }
  library: string
  version: string
  isLatestVersion: boolean
  sections: AbbrevApiReferenceSection[]
}

export async function ReferenceNavigation({
  name,
  icon,
  // libPath,
  library,
  version,
  isLatestVersion,
  sections,
}: ReferenceNavigationProps) {
  const basePath = `/reference/${library}${isLatestVersion ? '' : `/${version}`}`

  return (
    <div className="w-full flex flex-col pt-3 pb-5 gap-3">
      <div className="flex items-center gap-3">
        {icon && <MenuIconPicker icon={icon} width={21} height={21} />}
        <span className="text-base text-brand-600">{name}</span>
        {/* <RefVersionDropdown library={libPath} currentVersion={version} /> */}
      </div>
      <ul className="flex flex-col gap-2">
        {sections?.map((section, index) =>
          section.type === 'category' ? (
            <li key={section.id ?? String(index)}>
              <RefCategory basePath={basePath} section={section} />
            </li>
          ) : (
            <li key={section.id ?? String(index)} className={topLvlRefNavItemStyles}>
              <RefLink basePath={basePath} section={section} />
            </li>
          )
        )}
      </ul>
    </div>
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
  if (!('items' in section && section.items && section.items.length > 0)) return null

  return (
    <>
      <Divider />
      {'title' in section && <SideMenuTitle className="py-2">{section.title}</SideMenuTitle>}
      <ul className="space-y-2">
        {section.items?.map((item) => (
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

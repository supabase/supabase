import { isFeatureEnabled } from 'common'
import { cn } from 'ui'

import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import RefVersionDropdown from '~/components/RefVersionDropdown'
import { getReferenceSections } from '~/features/docs/Reference.generated.singleton'
import {
  RefLink,
  ReferenceActiveCrumb,
  ReferenceNavigationScrollHandler,
} from '~/features/docs/Reference.navigation.client'
import { type AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { type CrumbHeading } from '~/layouts/HeadingSlot'

export interface ReferenceNavigationProps {
  libraryId: string
  name: string
  menuData: { icon?: string }
  libPath: string
  version: string
  isLatestVersion: boolean
  // Spike (DOCS-1268): API reference sidebar links navigate to real pages
  // instead of scrolling within one giant page. SDK/CLI/self-hosting callers
  // never pass this, so their behavior is unchanged.
  realNavigation?: boolean
}

interface RefCategoryProps {
  basePath: string
  section: AbbrevApiReferenceSection
  realNavigation?: boolean
}

const flattenSections = (sections: AbbrevApiReferenceSection[]): AbbrevApiReferenceSection[] =>
  sections.flatMap((section) => [section, ...flattenSections(section.items ?? [])])

const getCrumbHeadings = (basePath: string, sections: AbbrevApiReferenceSection[]) =>
  flattenSections(sections).reduce<CrumbHeading[]>((headings, section) => {
    if (section.slug && section.title) {
      headings.push({ url: `${basePath}/${section.slug}`, title: section.title })
    }
    return headings
  }, [])

export async function ReferenceNavigation({
  libraryId,
  name,
  menuData,
  libPath,
  version,
  isLatestVersion,
  realNavigation,
}: ReferenceNavigationProps) {
  const navSections = await getReferenceSections(libraryId, version)
  const filteredNavSections = navSections?.filter((section) => section.title !== 'Auth')
  const displayedNavSections = isFeatureEnabled('sdk:auth') ? navSections : filteredNavSections

  const basePath = `/reference/${libPath}${isLatestVersion ? '' : `/${version}`}`

  return (
    <ReferenceNavigationScrollHandler
      aria-label={`${name} reference`}
      className="w-full flex flex-col pt-3 pb-5 gap-3 layout-v2:pt-0 layout-v2:pb-0 layout-v2:gap-4"
    >
      {displayedNavSections ? (
        <ReferenceActiveCrumb
          basePath={basePath}
          headings={getCrumbHeadings(basePath, displayedNavSections)}
        />
      ) : null}
      <div className="flex items-center gap-3 layout-v2:lg:hidden">
        {'icon' in menuData ? (
          <MenuIconPicker
            icon={menuData.icon || ''}
            width={21}
            height={21}
            className="layout-v2:size-4"
          />
        ) : null}
        <span className="text-base text-brand-600 layout-v2:text-sm layout-v2:font-medium layout-v2:text-foreground">
          {name}
        </span>
        <RefVersionDropdown library={libPath} currentVersion={version} />
      </div>
      <ul className="flex flex-col gap-2 layout-v2:gap-1">
        {displayedNavSections?.map((section) =>
          section.type === 'category' ? (
            <li key={section.id}>
              <RefCategory basePath={basePath} section={section} realNavigation={realNavigation} />
            </li>
          ) : (
            <li key={section.id} className={topLvlRefNavItemStyles}>
              <RefLink basePath={basePath} section={section} realNavigation={realNavigation} />
            </li>
          )
        )}
      </ul>
    </ReferenceNavigationScrollHandler>
  )
}

const topLvlRefNavItemStyles = 'leading-5'

function RefCategory({ basePath, section, realNavigation }: RefCategoryProps) {
  if (!('items' in section && section.items && section.items.length > 0)) return null

  return (
    <div className="layout-v2:pt-2">
      <hr className="w-full h-px my-3 bg-control layout-v2:hidden" />
      {'title' in section ? (
        <div
          className={cn(
            'font-mono font-medium text-xs text-foreground tracking-wider uppercase py-2',
            'layout-v2:py-1 layout-v2:font-sans layout-v2:text-sm layout-v2:text-foreground-light',
            'layout-v2:tracking-normal layout-v2:normal-case'
          )}
        >
          {section.title}
        </div>
      ) : null}
      <ul className="space-y-2 layout-v2:space-y-0 layout-v2:docs-rail-sublist">
        {section.items?.map((item) => (
          <li key={item.id} className={topLvlRefNavItemStyles}>
            <RefLink
              basePath={basePath}
              section={item}
              className="layout-v2:docs-active-bar"
              realNavigation={realNavigation}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

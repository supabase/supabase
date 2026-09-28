import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import RefVersionDropdown from '~/components/RefVersionDropdown'
import { getReferenceSections } from '~/features/docs/Reference.generated.singleton'
import {
  ACTIVE_BAR_CLASS_NAME,
  ReferenceActiveCrumb,
  ReferenceNavigationScrollHandler,
  RefLink,
  type ReferenceCrumbHeading,
} from '~/features/docs/Reference.navigation.client'
import { type AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { isFeatureEnabled } from 'common'

interface ReferenceNavigationProps {
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
  // only one of the two rendered copies owns the header crumb
  hasActiveCrumb?: boolean
}

interface RefCategoryProps {
  basePath: string
  section: AbbrevApiReferenceSection
  realNavigation?: boolean
}

const flattenSections = (sections: AbbrevApiReferenceSection[]): AbbrevApiReferenceSection[] =>
  sections.flatMap((section) => [section, ...flattenSections(section.items ?? [])])

const getCrumbHeadings = (basePath: string, sections: AbbrevApiReferenceSection[]) =>
  flattenSections(sections).reduce<ReferenceCrumbHeading[]>((headings, section) => {
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
  hasActiveCrumb = false,
}: ReferenceNavigationProps) {
  const navSections = await getReferenceSections(libraryId, version)
  const filteredNavSections = navSections?.filter((section) => section.title !== 'Auth')
  const displayedNavSections = isFeatureEnabled('sdk:auth') ? navSections : filteredNavSections

  const basePath = `/reference/${libPath}${isLatestVersion ? '' : `/${version}`}`

  return (
    <ReferenceNavigationScrollHandler
      aria-label={`${name} reference`}
      className="w-full flex flex-col gap-4"
    >
      {hasActiveCrumb && displayedNavSections ? (
        <ReferenceActiveCrumb
          basePath={basePath}
          headings={getCrumbHeadings(basePath, displayedNavSections)}
        />
      ) : null}
      <div className="flex items-center gap-2">
        {'icon' in menuData ? (
          <MenuIconPicker icon={menuData.icon || ''} width={16} height={16} />
        ) : null}
        <span className="text-sm font-medium text-foreground">{name}</span>
        <RefVersionDropdown library={libPath} currentVersion={version} />
      </div>
      <ul className="flex flex-col gap-1">
        {displayedNavSections?.map((section) =>
          section.type === 'category' ? (
            <li key={section.id}>
              <RefCategory basePath={basePath} section={section} realNavigation={realNavigation} />
            </li>
          ) : (
            <li key={section.id}>
              <RefLink basePath={basePath} section={section} realNavigation={realNavigation} />
            </li>
          )
        )}
      </ul>
    </ReferenceNavigationScrollHandler>
  )
}

function RefCategory({ basePath, section, realNavigation }: RefCategoryProps) {
  if (!('items' in section && section.items && section.items.length > 0)) return null

  return (
    <div className="pt-2">
      {'title' in section ? (
        <span className="block py-1 text-sm font-medium text-foreground-light">
          {section.title}
        </span>
      ) : null}
      <ul className="mt-1 ml-px border-l pl-3">
        {section.items?.map((item) => (
          <li key={item.id}>
            <RefLink
              basePath={basePath}
              section={item}
              className={ACTIVE_BAR_CLASS_NAME}
              realNavigation={realNavigation}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * These functions are used to process data required for nav menus in
 * `getStaticPaths` and/or `getStaticProps`.
 *
 * A lot of data is required for reference nav menus. This should be isolated
 * from code sent to the client to prevent bloating of client bundle size. This
 * isolation also means we can afford to be a bit wasteful with array
 * creation for easier-to-follow pipelines.
 *
 * Nav utilities that can be used on the client go in a separate file.
 */

import { compact, flow } from 'lodash'

import { type RefMenuCategory, type RefMenuItem, UNTITLED } from './NavigationMenuRefListItems'

import type cliCommonSections from '~/spec/common-cli-sections.json'
import type commonClientLibSections from '~/spec/common-client-libs-sections.json'

type CommonRefSections = typeof commonClientLibSections | typeof cliCommonSections
type IncludeList = {
  tag: string
  list: Array<string>
}

/**
 * Creates a string ID with weak guarantees on uniqueness.
 *
 * Randomizing is alright because this is only run on the server and the
 * resulting string is sent verbatim to the client.
 */
const weakUniqId = () => Math.random().toString(36).slice(2)

/**
 * Items are excluded if:
 * - They are explicitly excluded by defining an `excludes` array.
 * - They are implicitly excluded because they aren't defined in the specific
 *   spec.
 */
const isExcluded = <T extends { id: string; type: string }>(
  includeList: IncludeList,
  excludedName: string | undefined,
  section: T
) =>
  (excludedName &&
    'excludes' in section &&
    Array.isArray(section.excludes) &&
    !!section.excludes?.includes(excludedName)) ||
  (section.type === includeList.tag && !includeList.list.includes(section.id as string))

/**
 * Marks excluded items from the commont client lib spec as null.
 */
const markExcluded =
  (includeList: IncludeList, excludedName: string | undefined) =>
  <Elem extends { id: string; type: string }, T extends Array<Elem>>(libSections: T) =>
    libSections.map((section) => {
      if (isExcluded(includeList, excludedName, section)) return null
      if (!('items' in section)) return section
      if (!Array.isArray(section.items)) {
        const { items, ...rest } = section
        return rest
      }
      return {
        ...section,
        items: removeExcluded(includeList, excludedName)(section.items),
      }
    })

/**
 * Creates a function that filters the common client library spec to remove
 * functions that are not relevant to the current client library.
 *
 * @param { string } excludedName - A name in the exclusions list of the common client library spec
 * @param { string[] } includeList - Functions included in the spec of  the current client library
 */
const removeExcluded =
  (includeList: IncludeList, excludedName: string | undefined) =>
  <Elem extends { id: string; type: string }, T extends Array<Elem>>(libSections: T) =>
    compact(markExcluded(includeList, excludedName)(libSections))

const createUntitledCategory = () =>
  ({
    id: weakUniqId(),
    name: UNTITLED,
    items: [],
  }) satisfies RefMenuCategory

/**
 * Creates a function that reformats a CommonClientLibSection into a RefMenuItem
 * containing the minimal information required to render the nav menu.
 */
const reformat =
  (sectionPath: `/${string}`) =>
  <T extends { title: string }>(curr: T) => {
    const item: RefMenuItem = {
      id: weakUniqId(),
      name: curr.title,
      href: `${sectionPath}/${'slug' in curr ? curr.slug : ''}`,
      slug: 'slug' in curr ? `${curr.slug}` : '',
    }

    if ('items' in curr && Array.isArray(curr.items)) {
      item.items = curr.items.map(reformat(sectionPath))
    }

    return item
  }

/**
 * Creates a function that organizes the common client lib spec by category.
 */
const collectCategories = (sectionPath: `/${string}`) => (libSections: CommonRefSections) =>
  libSections.reduce((allSections, currentSection) => {
    if (currentSection.type !== 'category') {
      // Current section is a category member
      const currentCategory =
        allSections.at(-1) ?? (allSections.push(createUntitledCategory()), allSections.at(-1))
      currentCategory.items.push(reformat(sectionPath)(currentSection))
    } else {
      // Current section is a category
      allSections.push({
        id: weakUniqId(),
        name: currentSection.title,
        items: currentSection.items.map(reformat(sectionPath)),
      })
    }

    return allSections
  }, [] as Array<RefMenuCategory>)

type ToClientLibraryMenuParams = {
  sections: CommonRefSections
  excludedName?: string
  includeList: IncludeList
  sectionPath: `/${string}`
}

/**
 * Reformats the common client lib spec into a minimal array of data needed to
 * produce a nav menu.
 */
const toRefNavMenu = ({
  sections,
  excludedName,
  includeList,
  sectionPath,
}: ToClientLibraryMenuParams) =>
  flow([removeExcluded(includeList, excludedName), collectCategories(sectionPath)])(
    sections
  ) as unknown as ReturnType<ReturnType<typeof collectCategories>> // cast to return type of last function in flow

export type { CommonRefSections, IncludeList }
export { toRefNavMenu }

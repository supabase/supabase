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

/**
 * Makes it obvious if we accidentally use this code in the browser.
 */
import assert from 'node:assert'
assert.ok('Running in Node')

import { compact, flow } from 'lodash'

import { type RefMenuCategory, type RefMenuItem, UNTITLED } from './NavigationMenuRefListItems'

import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }

type CommonClientLibSections = typeof commonClientLibSections

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
 * - They are implicitly excluded because the function is not defined within
 *   the current client library.
 */
const isExcluded = <T extends { id: string; type: string }>(
  excludedName: string,
  includedFunctions: Array<string>,
  section: T
) =>
  ('excludes' in section &&
    Array.isArray(section.excludes) &&
    !!section.excludes?.includes(excludedName)) ||
  (section.type === 'function' && !includedFunctions.includes(section.id as string))

/**
 * Marks excluded items from the commont client lib spec as null.
 */
const markExcluded =
  (excludedName: string, includedFunctions: Array<string>) =>
  <Elem extends { id: string; type: string }, T extends Array<Elem>>(libSections: T) =>
    libSections.map((section) => {
      if (isExcluded(excludedName, includedFunctions, section)) return null
      if (!('items' in section)) return section
      if (!Array.isArray(section.items)) {
        const { items, ...rest } = section
        return rest
      }
      return {
        ...section,
        items: removeExcluded(excludedName, includedFunctions)(section.items),
      }
    })

/**
 * Creates a function that filters the common client library spec to remove
 * functions that are not relevant to the current client library.
 *
 * @param { string } excludedName - A name in the exclusions list of the common client library spec
 * @param { string[] } includedFunctions - Functions included in the spec of  the current client library
 */
const removeExcluded =
  (excludedName: string, includedFunctions: Array<string>) =>
  <Elem extends { id: string; type: string }, T extends Array<Elem>>(libSections: T) =>
    compact(markExcluded(excludedName, includedFunctions)(libSections))

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
const collectCategories = (sectionPath: `/${string}`) => (libSections: CommonClientLibSections) =>
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
  excludedName: string
  includedFunctions: Array<string>
  sectionPath: `/${string}`
}

/**
 * Reformats the common client lib spec into a minimal array of data needed to
 * produce a nav menu.
 */
const toClientLibraryMenu = ({
  excludedName,
  includedFunctions,
  sectionPath,
}: ToClientLibraryMenuParams) =>
  flow([removeExcluded(excludedName, includedFunctions), collectCategories(sectionPath)])(
    commonClientLibSections
  ) as unknown as (
    params: ToClientLibraryMenuParams
  ) => ReturnType<ReturnType<typeof collectCategories>> // cast to return type of last function in flow

export { toClientLibraryMenu }

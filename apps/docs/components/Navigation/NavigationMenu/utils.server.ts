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

// Helps to determine if we accidentally use this code in the browser.
import assert from 'node:assert'
assert.ok('Running in Node')

import { compact, flow } from 'lodash'

import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }

type CommonClientLibSections = typeof commonClientLibSections

// Move these to a reference menu component later
type MenuItem = {
  id: string
  name: string
  href: string
  items?: Array<MenuItem>
}

type MenuCategory = {
  id: string
  name: string
  items: Array<MenuItem>
}

// Move this to a reference menu component later
const UNTITLED = '__UNTITLED_NAV_CATEGORY__'

// Move this a utility file later
/**
 * Creates a string ID with weak guarantees on uniqueness.
 */
const weakUniqId = () => Math.random().toString(36).slice(2)

const isExcluded = <T extends { id: string; type: string }>(
  excludedName: string,
  includedFunctions: Array<string>,
  section: T
) =>
  ('excludes' in section &&
    Array.isArray(section.excludes) &&
    !!section.excludes?.includes(excludedName)) ||
  (section.type === 'function' && !includedFunctions.includes(section.id as string))

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
 * Creates a function that will filter the common client library spec to
 * remove functions that are not relevant to the current client library.
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
  }) satisfies MenuCategory

/**
 * Reformats a CommonClientLibSection into a MenuItem
 */
const reformat =
  (sectionPath: `/${string}`) =>
  <T extends { title: string }>(curr: T) => {
    const item: MenuItem = {
      id: weakUniqId(),
      name: curr.title,
      href: `${sectionPath}/${'slug' in curr ? curr.slug : ''}`,
    }

    if ('items' in curr && Array.isArray(curr.items)) {
      item.items = curr.items.map(reformat(sectionPath))
    }

    return item
  }

const collectCategories = (sectionPath: `/${string}`) => (libSections: CommonClientLibSections) =>
  libSections.reduce((allSections, currentSection) => {
    // Current section is not a category
    if (currentSection.type !== 'category') {
      const currentCategory =
        allSections.at(-1) ?? (allSections.push(createUntitledCategory()), allSections.at(-1))
      currentCategory.items.push(reformat(sectionPath)(currentSection))
    } else {
      allSections.push({
        id: weakUniqId(),
        name: currentSection.title,
        items: currentSection.items.map(reformat(sectionPath)),
      })
    }

    return allSections
  }, [] as Array<MenuCategory>)

type ToClientLibraryMenuParams = {
  excludedName: string
  includedFunctions: Array<string>
  sectionPath: `/${string}`
}

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

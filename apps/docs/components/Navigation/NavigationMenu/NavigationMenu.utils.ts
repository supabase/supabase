import { ICommonItem } from '~/components/reference/Reference.types'

// check if the link is allowed to be displayed
export function isFuncNotInLibraryOrVersion(id, type, allowedKeys) {
  if (id && allowedKeys && !allowedKeys.includes(id) && type !== 'markdown') {
    return true
  }
}

/**
 * Recursively filter common sections and their sub items based on
 * what is available in their spec
 */
export function deepFilterSections<T extends ICommonItem>(
  sections: T[],
  specFunctionIds: string[]
): T[] {
  return sections
    .filter(
      (section) =>
        section.type === 'category' ||
        section.type === 'markdown' ||
        specFunctionIds.includes(section.id)
    )
    .map((section) => {
      if ('items' in section) {
        return {
          ...section,
          items: deepFilterSections(section.items, specFunctionIds),
        }
      }
      return section
    })
}

import { useEffect, useState } from 'react'
import { ICommonItem } from '~/components/reference/Reference.types'
import { Json } from '~/types'

export function getPathWithoutHash(relativePath: string) {
  return new URL(relativePath, 'http://placeholder').pathname
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
    .flatMap((section) => {
      if ('items' in section) {
        const items = deepFilterSections(section.items, specFunctionIds)

        // Only include this category (heading) if it has subitems
        if (items.length > 0) {
          return {
            ...section,
            items,
          }
        }

        return []
      }
      return section
    })
}

/**
 * Imports common sections file dynamically.
 *
 * Dynamic imports allow for code splitting which
 * dramatically reduces app bundle size.
 *
 * See https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
 */
export function useCommonSections(commonSectionsFile: string) {
  const [commonSections, setCommonSections] = useState<ICommonItem[]>()

  useEffect(() => {
    async function fetchCommonSections() {
      const commonSections = await import(
        /* webpackInclude: /common-.*\.json$/ */
        /* webpackMode: "lazy" */
        `~/spec/${commonSectionsFile}`
      )
      setCommonSections(commonSections.default)
    }
    fetchCommonSections()
  }, [commonSectionsFile])

  return commonSections
}

/**
 * Imports spec file dynamically.
 *
 * Dynamic imports allow for code splitting which
 * dramatically reduces app bundle size.
 *
 * See https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
 */
export function useSpec(specFile?: string) {
  const [spec, setSpec] = useState<Json>()

  useEffect(() => {
    if (!specFile) {
      return
    }
    async function fetchSpec() {
      const spec = await import(
        /* webpackInclude: /supabase_.*\.ya?ml$/ */
        /* webpackMode: "lazy" */
        `~/spec/${specFile}`
      )
      setSpec(spec.default)
    }
    fetchSpec()
  }, [specFile])

  return spec
}

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import type { ICommonItem } from '~/components/reference/Reference.types'
import type { Json } from '~/features/helpers.types'
import { menuState } from '../../../hooks/useMenuState'

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

export const useCloseMenuOnRouteChange = () => {
  const pathname = usePathname()

  useEffect(() => {
    menuState.setMenuMobileOpen(false)
  }, [pathname])
}

export const getMenuId = (pathname: string | null) => {
  pathname = (pathname ??= '').replace(/^\/guides\//, '')

  switch (true) {
    case pathname.startsWith('ai'):
      return MenuId.Ai
    case pathname.startsWith('api'):
      return MenuId.Api
    case pathname.startsWith('auth'):
      return MenuId.Auth
    case pathname.startsWith('cli'):
      return MenuId.Cli
    case pathname.startsWith('database'):
      return MenuId.Database
    case pathname.startsWith('functions'):
      return MenuId.Functions
    case pathname.startsWith('getting-started'):
      return MenuId.GettingStarted
    case pathname.startsWith('graphql'):
      return MenuId.Graphql
    case pathname.startsWith('platform'):
      return MenuId.Platform
    case pathname.startsWith('realtime'):
      return MenuId.Realtime
    case pathname.startsWith('resources'):
      return MenuId.Resources
    case pathname.startsWith('self-hosting'):
      return MenuId.SelfHosting
    case pathname.startsWith('storage'):
      return MenuId.Storage
    default:
      return MenuId.GettingStarted
  }
}

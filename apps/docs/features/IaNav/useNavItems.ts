'use client'

import * as option1NavItems from './option1.constants'
import { useIaNavVariant } from './useIaNavVariant'
import * as currentNavItems from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

/**
 * Returns the navigation config for the visitor's `docs-ia-mvp-v1` variant.
 */
export function useNavItems(): typeof currentNavItems {
  const variant = useIaNavVariant()

  return variant === 'option-1' ? option1NavItems : currentNavItems
}

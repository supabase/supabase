'use client'

import { useCachedIaNavFlag } from './useIaNavVariant'

/**
 * True once the client has read the variant cached on the last visit. Until then, put
 * `IA_NAV_PENDING_CLASS` on the nav: it hides the nav only for a visitor cached on option-1,
 * since the server html always holds the control nav.
 */
export function useIaNavReady(): boolean {
  return useCachedIaNavFlag() !== null
}

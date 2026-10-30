import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'

// PostHog multivariate flag for the new docs information architecture.
export const IA_NAV_FLAG = 'docs-ia-mvp-v1'

export type IaNavVariant = 'control' | 'option-1'

const VARIANTS: IaNavVariant[] = ['control', 'option-1']

export const isIaNavVariant = (value: unknown): value is IaNavVariant =>
  VARIANTS.includes(value as IaNavVariant)

// runs before paint, so a visitor cached on option-1 never sees the control nav the server renders
export const IA_NAV_CACHE_SCRIPT = `try{if(localStorage.getItem('${LOCAL_STORAGE_KEYS.IA_NAV_FLAG}')==='option-1')document.documentElement.dataset.iaNav='option-1'}catch(e){}`

export const IA_NAV_PENDING_CLASS = '[[data-ia-nav=option-1]_&]:invisible'

import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'

// PostHog multivariate flag for the new docs information architecture.
export const IA_NAV_FLAG = 'docs-ia-mvp-v1'

export type IaNavVariant = 'control' | 'option-1'

const VARIANTS: IaNavVariant[] = ['control', 'option-1']

export const isIaNavVariant = (value: unknown): value is IaNavVariant =>
  VARIANTS.includes(value as IaNavVariant)

// runs before paint, so a visitor on option-1 never sees the control nav the server renders.
// the url override wins over the value from the last visit
export const IA_NAV_CACHE_SCRIPT = `try{var o=new URLSearchParams(location.search).get('${IA_NAV_FLAG}');var v=${JSON.stringify(VARIANTS)}.indexOf(o)>-1?o:localStorage.getItem('${LOCAL_STORAGE_KEYS.IA_NAV_FLAG}');if(v==='option-1')document.documentElement.dataset.iaNav='option-1'}catch(e){}`

export const IA_NAV_PENDING_CLASS = 'in-data-[ia-nav=option-1]:invisible'

// Requests that force a variant are rewritten under this segment so the server HTML has its nav.
export const IA_NAV_ROUTE_SEGMENT = 'ia'

export const iaNavRoutePrefix = (variant: IaNavVariant) => `/${IA_NAV_ROUTE_SEGMENT}/${variant}`

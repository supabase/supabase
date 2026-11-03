// PostHog multivariate flag for the new docs information architecture.
export const IA_NAV_FLAG = 'docs-ia-mvp-v1'

export type IaNavVariant = 'control' | 'option-1'

const VARIANTS: IaNavVariant[] = ['control', 'option-1']

export const isIaNavVariant = (value: unknown): value is IaNavVariant =>
  VARIANTS.includes(value as IaNavVariant)

// Requests that force a variant are rewritten under this segment so the server HTML has its nav.
export const IA_NAV_ROUTE_SEGMENT = 'ia'

export const iaNavRoutePrefix = (variant: IaNavVariant) => `/${IA_NAV_ROUTE_SEGMENT}/${variant}`

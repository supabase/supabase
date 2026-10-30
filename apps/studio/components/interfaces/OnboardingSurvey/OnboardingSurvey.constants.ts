import { ORG_KIND_TYPES, type OrgKind } from '../Organization/NewOrg/OrganizationDetailsFields'

export const BUILDING_MAX_LENGTH = 500

export const BUILDING_PLACEHOLDER =
  'e.g. realtime collaboration, an AI support workflow, or an operations dashboard'

export {
  ORG_KIND_DEFAULT,
  ORG_KIND_TYPES,
  ORG_SIZE_DEFAULT,
  ORG_SIZE_TYPES,
} from '../Organization/NewOrg/OrganizationDetailsFields'

// Same values as ORG_KIND_TYPES, worded as answers to "Who is this org for?"
export const SURVEY_ORG_KIND_TYPES: Record<OrgKind, string> = {
  ...ORG_KIND_TYPES,
  UNDISCLOSED: 'Prefer not to say',
}

export const ONBOARDING_SURVEY_EXPERIMENT_ID = 'onboardingSurveyPlacement'

export const ONBOARDING_SURVEY_VARIANTS = [
  'control',
  'org_form_collapsed',
  'org_form_expanded',
] as const

export type OnboardingSurveyVariant = (typeof ONBOARDING_SURVEY_VARIANTS)[number]

const ORG_FORM_VARIANTS: ReadonlySet<OnboardingSurveyVariant> = new Set([
  'org_form_collapsed',
  'org_form_expanded',
])

export function isOnboardingSurveyVariant(value: unknown): value is OnboardingSurveyVariant {
  return (
    typeof value === 'string' && (ONBOARDING_SURVEY_VARIANTS as readonly string[]).includes(value)
  )
}

export function isOrgFormVariant(variant?: OnboardingSurveyVariant) {
  return !!variant && ORG_FORM_VARIANTS.has(variant)
}

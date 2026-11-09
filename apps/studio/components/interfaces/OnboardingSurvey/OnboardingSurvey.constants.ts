import { ORG_KIND_TYPES, type OrgKind } from '../Organization/NewOrg/OrganizationDetailsFields'

// How long after creating an org its creator can be asked the survey again
export const ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS = 5 * 60 * 1000

export type OnboardingSurveyOption = {
  value: string
  label: string
  description?: string
  /** Shown below a divider, e.g. Prefer not to say */
  isOptOut?: boolean
}

export const PREFER_NOT_TO_SAY_OPTION: OnboardingSurveyOption = {
  value: 'prefer_not_to_say',
  label: 'Prefer not to say',
  isOptOut: true,
}

export const BUILDING_OPTIONS: readonly OnboardingSurveyOption[] = [
  { value: 'ai_assistant_or_agent', label: 'AI assistant or agent' },
  { value: 'ai_search_or_knowledge_base', label: 'AI search or knowledge base' },
  { value: 'b2b_saas', label: 'B2B SaaS application' },
  { value: 'internal_tool_or_automation', label: 'Internal tool or workflow automation' },
  { value: 'consumer_app', label: 'Consumer web or mobile app' },
  { value: 'social_or_community', label: 'Social or community app' },
  { value: 'marketplace_or_booking', label: 'Marketplace or booking platform' },
  { value: 'ecommerce', label: 'E-commerce or commerce platform' },
  { value: 'developer_tool_or_app_builder', label: 'Developer tool or app-building platform' },
  { value: 'analytics_or_reporting', label: 'Analytics or reporting application' },
  { value: 'other', label: 'Other' },
  PREFER_NOT_TO_SAY_OPTION,
]

export {
  ORG_KIND_DEFAULT,
  ORG_KIND_TYPES,
  ORG_SIZE_DEFAULT,
  ORG_SIZE_TYPES,
} from '../Organization/NewOrg/OrganizationDetailsFields'

// Same values as ORG_KIND_TYPES, worded as answers to "Who is this org for?".
// UNDISCLOSED is the org kind's own Prefer not to say.
export const SURVEY_ORG_KIND_OPTIONS: readonly OnboardingSurveyOption[] = (
  Object.keys(ORG_KIND_TYPES) as OrgKind[]
).map((kind) =>
  kind === 'UNDISCLOSED'
    ? { value: kind, label: 'Prefer not to say', isOptOut: true }
    : { value: kind, label: ORG_KIND_TYPES[kind] }
)

export const ONBOARDING_SURVEY_EXPERIMENT_ID = 'onboardingSurveyPlacement'

// Users in `control` get the survey and its follow-up; users the flag doesn't
// assign get the default form.
export const ONBOARDING_SURVEY_VARIANTS = ['control'] as const

export type OnboardingSurveyVariant = (typeof ONBOARDING_SURVEY_VARIANTS)[number]

export function isOnboardingSurveyVariant(value: unknown): value is OnboardingSurveyVariant {
  return (
    typeof value === 'string' && (ONBOARDING_SURVEY_VARIANTS as readonly string[]).includes(value)
  )
}

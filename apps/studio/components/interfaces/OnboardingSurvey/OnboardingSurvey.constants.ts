import { z } from 'zod'

export const ORG_KIND_TYPES = {
  PERSONAL: 'Personal',
  EDUCATIONAL: 'Educational',
  STARTUP: 'Startup',
  AGENCY: 'Agency',
  COMPANY: 'Company',
  UNDISCLOSED: 'N/A',
}

export const ORG_KIND_DEFAULT = 'PERSONAL'

export const ORG_SIZE_TYPES = {
  '1': '1 - 10',
  '10': '10 - 49',
  '50': '50 - 99',
  '100': '100 - 299',
  '300': 'More than 300',
}

export const ORG_SIZE_DEFAULT = '1'

export type OrgKind = keyof typeof ORG_KIND_TYPES
export type OrgSize = keyof typeof ORG_SIZE_TYPES

const orgKindValues = [
  'PERSONAL',
  'EDUCATIONAL',
  'STARTUP',
  'AGENCY',
  'COMPANY',
  'UNDISCLOSED',
] as const

const orgSizeValues = ['1', '10', '50', '100', '300'] as const

export const orgKindSchema = z
  .string()
  .transform((val) => val.toUpperCase())
  .pipe(z.enum(orgKindValues))

export const orgSizeSchema = z.enum(orgSizeValues)

export const onboardingSurveySchema = z.object({
  kind: orgKindSchema,
  size: orgSizeSchema,
  building: z.string(),
  can_code: z.string(),
})

// How long after creating an org its creator can be asked the survey again
export const ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS = 5 * 60 * 1000

export type OnboardingSurveyOption = {
  value: string
  label: string
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

export const CAN_CODE_OPTIONS: readonly OnboardingSurveyOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

// Same values as ORG_KIND_TYPES, worded as answers to "Who is this org for?".
// UNDISCLOSED is the org kind's own Prefer not to say.
export const SURVEY_ORG_KIND_OPTIONS: readonly OnboardingSurveyOption[] = (
  Object.keys(ORG_KIND_TYPES) as OrgKind[]
).map((kind) =>
  kind === 'UNDISCLOSED'
    ? { value: kind, label: 'Prefer not to say', isOptOut: true }
    : { value: kind, label: ORG_KIND_TYPES[kind] }
)

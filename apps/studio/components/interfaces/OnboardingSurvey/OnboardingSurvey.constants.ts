export const HEARD_FROM_OPTIONS = [
  { value: 'search_engine', label: 'Search engine' },
  { value: 'social_media', label: 'Social media' },
  { value: 'ai_tool', label: 'AI tool' },
  { value: 'friend_colleague', label: 'Friend or colleague' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'blog_article', label: 'Blog or article' },
  { value: 'conference', label: 'Conference' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'other', label: 'Other' },
] as const

export type HeardFromOptionValue = (typeof HEARD_FROM_OPTIONS)[number]['value']

export const HEARD_FROM_OTHER_VALUE = 'other'

export const HEARD_FROM_FOLLOW_UP_BY_VALUE: Record<
  string,
  { label: string; placeholder: string } | undefined
> = {
  social_media: {
    label: 'Which platform?',
    placeholder: 'e.g. X, Reddit, LinkedIn',
  },
  ai_tool: {
    label: 'Which AI tool?',
    placeholder: 'e.g. ChatGPT, Claude, Cursor',
  },
  youtube: {
    label: 'Which channel or video?',
    placeholder: 'e.g. Supabase, Fireship, KRAZAM',
  },
  blog_article: {
    label: 'Which blog or article?',
    placeholder: 'Paste a title, site, or link',
  },
  conference: {
    label: 'Which conference?',
    placeholder: 'e.g. Launch Week, PostgresConf, local meetup',
  },
  podcast: {
    label: 'Which podcast?',
    placeholder: 'e.g. Syntax, Changelog, Software Engineering Daily',
  },
  other: {
    label: 'Tell us where',
    placeholder: 'Tell us where',
  },
}

export function formatHeardFromAnswer(value?: string, detail?: string) {
  const trimmedValue = value?.trim()
  const trimmedDetail = detail?.trim()

  if (!trimmedValue) return trimmedDetail
  if (!trimmedDetail) return trimmedValue
  if (trimmedValue === HEARD_FROM_OTHER_VALUE) return trimmedDetail

  return `${trimmedValue}: ${trimmedDetail}`
}

export const BUILDING_MAX_LENGTH = 500

export const BUILDING_PLACEHOLDER =
  'e.g. realtime collaboration, an AI support workflow, or an operations dashboard'

export {
  ORG_KIND_DEFAULT,
  ORG_KIND_TYPES,
  ORG_SIZE_DEFAULT,
  ORG_SIZE_TYPES,
} from '../Organization/NewOrg/OrganizationDetailsFields'

export const ONBOARDING_SURVEY_EXPERIMENT_ID = 'onboardingSurveyPlacement'

export const ONBOARDING_SURVEY_VARIANTS = [
  'control',
  'org_form_collapsed',
  'org_form_expanded',
  'dialog',
  'toast',
] as const

export type OnboardingSurveyVariant = (typeof ONBOARDING_SURVEY_VARIANTS)[number]

export type OnboardingSurveySurface = 'org_form' | 'project_home'

const ORG_FORM_VARIANTS: ReadonlySet<OnboardingSurveyVariant> = new Set([
  'org_form_collapsed',
  'org_form_expanded',
])

const PROJECT_HOME_VARIANTS: ReadonlySet<OnboardingSurveyVariant> = new Set(['dialog', 'toast'])

export function isOnboardingSurveyVariant(value: unknown): value is OnboardingSurveyVariant {
  return (
    typeof value === 'string' && (ONBOARDING_SURVEY_VARIANTS as readonly string[]).includes(value)
  )
}

export function isOrgFormVariant(variant?: OnboardingSurveyVariant) {
  return !!variant && ORG_FORM_VARIANTS.has(variant)
}

export function variantMatchesSurface(
  variant: OnboardingSurveyVariant | undefined,
  surface: OnboardingSurveySurface
) {
  if (!variant) return false
  if (surface === 'org_form') return ORG_FORM_VARIANTS.has(variant)
  if (surface === 'project_home') return PROJECT_HOME_VARIANTS.has(variant)
  return false
}

export type OnboardingSurveyAnswers = {
  heard_from?: string
  building?: string
}

export function buildOnboardingSurveyAnswers({
  heardFrom,
  building,
}: {
  heardFrom?: string
  building?: string
}): OnboardingSurveyAnswers {
  return {
    heard_from: heardFrom,
    building,
  }
}

export type OnboardingSurveyPromptStatus = 'submitted' | 'dismissed'

export type OnboardingSurveyPromptState = {
  status: OnboardingSurveyPromptStatus
  updatedAt: string
}

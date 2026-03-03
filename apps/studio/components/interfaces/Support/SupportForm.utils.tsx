// End of third-party imports

import {
  DocsSearchResultType as PageType,
  type DocsSearchResult as Page,
  type DocsSearchResultSection as PageSection,
} from 'common'
import { getProjectDetail } from 'data/projects/project-detail-query'
import dayjs from 'dayjs'
import { DOCS_URL } from 'lib/constants'
import { partition } from 'lodash'
import { Book, Github, Hash, MessageSquare } from 'lucide-react'
import {
  createLoader,
  createParser,
  createSerializer,
  parseAsString,
  type inferParserType,
  type UseQueryStatesKeysMap,
} from 'nuqs'
import type { Organization } from 'types'

import { CATEGORY_OPTIONS } from './Support.constants'

export const NO_PROJECT_MARKER = 'no-project'
export const NO_ORG_MARKER = 'no-org'

export const formatMessage = ({
  message,
  attachments = [],
  error,
}: {
  message: string
  attachments?: Array<string>
  error: string | null | undefined
}) => {
  const [harFiles, images] = partition(attachments, (x) => x.split('?token')[0].endsWith('.har'))
  const errorString = error != null ? `\n\nError: ${error}` : ''

  const imagesString = images.length > 0 ? `\n\nImage Attachments:\n${images.join('\n\n')}` : ''
  const harFilesString = harFiles.length > 0 ? `\n\nHAR Files:\n${harFiles.join('\n\n')}` : ''

  return `${message}${errorString}${imagesString}${harFilesString}`
}

export const formatStudioVersion = (commit: { commitSha: string; commitTime: string }): string => {
  const formattedTime =
    commit.commitTime === 'unknown'
      ? 'unknown time'
      : dayjs(commit.commitTime).format('YYYY-MM-DD HH:mm:ss Z')
  return `SHA ${commit.commitSha} deployed at ${formattedTime}`
}

export function getPageIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <Book strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <Github strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageSectionIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <Hash strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <MessageSquare strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function generateLink(pageType: PageType, link: string): string {
  switch (pageType) {
    case PageType.Markdown:
    case PageType.Reference:
      return `${DOCS_URL}${link}`
    case PageType.Integration:
      return `https://supabase.com${link}`
    case PageType.GithubDiscussion:
      return link
    default:
      throw new Error(`Unknown page type '${pageType}'`)
  }
}

export function formatSectionUrl(page: Page, section: PageSection): string {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.GithubDiscussion:
      return `${generateLink(page.type, page.path)}#${section.slug ?? ''}`
    case PageType.Reference:
      return `${generateLink(page.type, page.path)}/${section.slug ?? ''}`
    case PageType.Integration:
      return generateLink(page.type, page.path) // Assuming no section slug for Integration pages
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getOrgSubscriptionPlan(orgs: Organization[] | undefined, orgSlug: string | null) {
  if (!orgs || !orgSlug) return undefined

  const selectedOrg = orgs?.find((org) => org.slug === orgSlug)
  const subscriptionPlanId = selectedOrg?.plan.id
  return subscriptionPlanId
}

const categoryOptionsLower = CATEGORY_OPTIONS.map((option) => option.value.toLowerCase())
const parseAsCategoryOption = createParser({
  parse(queryValue) {
    const lowerValue = queryValue.toLowerCase()
    const matchingIndex = categoryOptionsLower.indexOf(lowerValue)
    return matchingIndex !== -1 ? CATEGORY_OPTIONS[matchingIndex].value : null
  },
  serialize(value) {
    return value ?? null
  },
})

const supportFormUrlState = {
  projectRef: parseAsString.withDefault(''),
  orgSlug: parseAsString.withDefault(''),
  category: parseAsCategoryOption,
  subject: parseAsString.withDefault(''),
  message: parseAsString.withDefault(''),
  error: parseAsString,
  /** Sentry event ID */
  sid: parseAsString,
} satisfies UseQueryStatesKeysMap
export type SupportFormUrlKeys = inferParserType<typeof supportFormUrlState>

export const loadSupportFormInitialParams = createLoader(supportFormUrlState)

const serializeSupportFormInitialParams = createSerializer(supportFormUrlState)

export function createSupportFormUrl(initialParams: Partial<SupportFormUrlKeys>) {
  const serializedParams = serializeSupportFormInitialParams(initialParams)
  return `/support/new${serializedParams ?? ''}`
}

/**
 * Determines which organization to select based on combination of:
 * - Selected project (if any)
 * - URL param (if any)
 * - Fallback
 */
export async function selectInitialOrgAndProject({
  projectRef,
  orgSlug,
  orgs,
}: {
  projectRef: string | null
  orgSlug: string | null
  orgs: Organization[]
}): Promise<{ projectRef: string | null; orgSlug: string | null }> {
  if (projectRef) {
    try {
      const projectDetails = await getProjectDetail({ ref: projectRef })
      if (projectDetails?.organization_id) {
        const org = orgs.find((o) => o.id === projectDetails.organization_id)
        if (org?.slug) {
          return {
            projectRef,
            orgSlug: org.slug,
          }
        }
      }
    } catch {
      // Can safely ignore, consider provided project ref invalid
    }
  }

  if (orgSlug) {
    const org = orgs.find((o) => o.slug === orgSlug)
    if (org?.slug) {
      return {
        projectRef: null,
        orgSlug: org.slug,
      }
    }
  }

  return {
    projectRef: null,
    orgSlug: orgs[0]?.slug ?? null,
  }
}

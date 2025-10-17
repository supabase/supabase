import { z } from 'zod'

import { isFeatureEnabled } from 'common'
import { PLAN_REQUEST_EMPTY_PLACEHOLDER } from 'components/ui/UpgradePlanButton'
import { CATEGORY_OPTIONS, type ExtendedSupportCategories } from './Support.constants'

const createFormSchema = (showClientLibraries: boolean) => {
  const baseSchema = z.object({
    organizationSlug: z.string().min(1, 'Please select an organization'),
    projectRef: z.string().min(1, 'Please select a project'),
    category: z.enum(
      CATEGORY_OPTIONS.map((opt) => opt.value) as [
        ExtendedSupportCategories,
        ...ExtendedSupportCategories[],
      ]
    ),
    severity: z.string(),
    library: z.string(),
    subject: z.string().min(1, 'Please add a subject heading'),
    message: z.string().min(1, "Please add a message about the issue that you're facing"),
    affectedServices: z.string(),
    allowSupportAccess: z.boolean(),
    dashboardSentryIssueId: z.string().optional(),
  })

  if (showClientLibraries) {
    return baseSchema
      .refine(
        (data) => {
          return !(data.category === 'Problem' && data.library === '')
        },
        {
          message: "Please select the library that you're facing issues with",
          path: ['library'],
        }
      )
      .refine(
        (data) => {
          return !data.message.includes(PLAN_REQUEST_EMPTY_PLACEHOLDER)
        },
        {
          message: `Please let us know which plan you'd like to upgrade to for your organization`,
          path: ['message'],
        }
      )
  }

  // When showClientLibraries is false, make library optional and remove the refine validation
  return baseSchema
    .extend({
      library: z.string().optional(),
    })
    .refine(
      (data) => {
        return !data.message.includes(PLAN_REQUEST_EMPTY_PLACEHOLDER)
      },
      {
        message: `Please let us know which plan you'd like to upgrade to for your organization`,
        path: ['message'],
      }
    )
}

const showClientLibraries = isFeatureEnabled('support:show_client_libraries')
export const SupportFormSchema = createFormSchema(showClientLibraries)
export type SupportFormValues = z.infer<typeof SupportFormSchema>

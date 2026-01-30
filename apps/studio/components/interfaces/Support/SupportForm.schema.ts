import { PLAN_REQUEST_EMPTY_PLACEHOLDER } from 'components/ui/UpgradePlanButton'
import { z } from 'zod'

import { CATEGORY_OPTIONS, type ExtendedSupportCategories } from './Support.constants'

export const SupportFormSchema = z
  .object({
    organizationSlug: z.string().min(1, 'Please select an organization'),
    projectRef: z.string().min(1, 'Please select a project'),
    category: z.enum(
      CATEGORY_OPTIONS.map((opt) => opt.value) as [
        ExtendedSupportCategories,
        ...ExtendedSupportCategories[],
      ]
    ),
    severity: z.string(),
    library: z.string().optional(),
    subject: z.string().min(1, 'Please add a subject heading'),
    message: z.string().min(1, "Please add a message about the issue that you're facing"),
    affectedServices: z.string(),
    allowSupportAccess: z.boolean(),
    attachDashboardLogs: z.boolean(),
    dashboardSentryIssueId: z.string().optional(),
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

export type SupportFormValues = z.infer<typeof SupportFormSchema>

import { z } from 'zod'

import { CATEGORY_OPTIONS, type ExtendedSupportCategories } from './Support.constants'
import { NO_ORG_MARKER } from './SupportForm.utils'

export const LinkSupportTicketFormSchema = z.object({
  conversation_id: z.string().min(1, 'Conversation ID is required'),
  organizationSlug: z
    .string()
    .min(1, 'Please select an organization')
    .refine((val) => val !== NO_ORG_MARKER, {
      message: 'Please select an organization',
    }),
  projectRef: z.string().min(1, 'Please select a project'),
  category: z.enum(
    CATEGORY_OPTIONS.map((opt) => opt.value) as [
      ExtendedSupportCategories,
      ...ExtendedSupportCategories[],
    ],
    {
      required_error: 'Please select a category',
    }
  ),
  allowSupportAccess: z.boolean(),
})

export type LinkSupportTicketFormValues = z.infer<typeof LinkSupportTicketFormSchema>

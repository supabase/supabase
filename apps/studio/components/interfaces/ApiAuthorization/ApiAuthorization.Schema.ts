import { z } from 'zod'

export const approvalFormSchema = z.object({
  selectedOrgSlug: z.string().min(1, 'Please select an organization'),
})
export type IApprovalFormSchema = z.infer<typeof approvalFormSchema>

export type ApprovalState = 'indeterminate' | 'approving' | 'declining' | 'approved' | 'declined'

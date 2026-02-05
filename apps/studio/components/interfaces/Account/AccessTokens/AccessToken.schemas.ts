import { z } from 'zod'

export const PermissionRowSchema = z.object({
  resource: z.string().min(1, 'Please select a resource'),
  action: z.string().min(1, 'Please select an action'),
})

export const TokenSchema = z.object({
  tokenName: z.string().min(1, 'Please enter a name for the token'),
  expiresAt: z.preprocess((val) => (val === 'never' ? undefined : val), z.string().optional()),
  resourceAccess: z.enum(['all-orgs', 'selected-orgs', 'selected-projects']),
  selectedOrganizations: z.array(z.string()).optional(),
  selectedProjects: z.array(z.string()).optional(),
  permissionRows: z.array(PermissionRowSchema).min(1, 'Please configure at least one permission'),
})

export type TokenFormValues = z.infer<typeof TokenSchema>
import * as z from 'zod'

import { isValidHttpUrl } from '@/lib/helpers'

export const formSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your application'),
  website: z
    .string()
    .min(1, 'Please provide a URL for your site')
    .url('Please provide a URL for your site')
    .refine((value) => isValidHttpUrl(value), 'Please provide a valid URL for your site'),
  redirect_uris: z
    .array(
      z.object({
        id: z.string(),
        value: z.string().min(1, 'Please provide a URL').url('Please provide a URL'),
      }),
      { required_error: 'Please provide at least one callback URL' }
    )
    .min(1, 'Please provide at least one callback URL'),
})

export type FormSchema = z.infer<typeof formSchema>

export const formSchemaWithOAuthAppScopedGrants = formSchema
  .extend({
    member_bound_grant: z.coerce.boolean(),
    member_bound_grant_confirmed: z.coerce.boolean().optional(),
    project_scoping: z.coerce.boolean(),
    project_scoping_confirmed: z.coerce.boolean().optional(),
  })
  .superRefine((values, context) => {
    if (values.member_bound_grant && !values.member_bound_grant_confirmed) {
      context.addIssue({
        code: 'custom',
        path: ['member_bound_grant_confirmed'],
        message: 'Please confirm you want to use the permissions of the person who connects',
      })
    }
    if (values.project_scoping && !values.project_scoping_confirmed) {
      context.addIssue({
        code: 'custom',
        path: ['project_scoping_confirmed'],
        message: 'Please confirm you want users to select specific projects',
      })
    }
  })

export type FormSchemaWithOAuthAppScopedGrants = z.infer<typeof formSchemaWithOAuthAppScopedGrants>

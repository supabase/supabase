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

export const formSchemaWithOAuthAppScopedGrants = formSchema.extend({
  member_bound_grant: z.coerce.boolean(),
  project_scoping: z.coerce.boolean(),
})

export type FormSchemaWithOAuthAppScopedGrants = z.infer<typeof formSchemaWithOAuthAppScopedGrants>

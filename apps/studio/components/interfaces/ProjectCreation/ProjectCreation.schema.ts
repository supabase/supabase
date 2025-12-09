import { z } from 'zod'

export const FormSchema = z.object({
  organization: z.string({
    required_error: 'Please select an organization',
  }),
  projectName: z
    .string()
    .trim()
    .min(1, 'Please enter a project name.') // Required field check
    .min(3, 'Project name must be at least 3 characters long.') // Minimum length check
    .max(64, 'Project name must be no longer than 64 characters.'), // Maximum length check
  postgresVersion: z.string({
    required_error: 'Please enter a Postgres version.',
  }),
  dbRegion: z.string({
    required_error: 'Please select a region.',
  }),
  cloudProvider: z.string({
    required_error: 'Please select a cloud provider.',
  }),
  dbPassStrength: z.number(),
  dbPass: z
    .string({ required_error: 'Please enter a database password.' })
    .min(1, 'Password is required.'),
  instanceSize: z.string().optional(),
  dataApi: z.boolean(),
  useApiSchema: z.boolean(),
  postgresVersionSelection: z.string(),
  useOrioleDb: z.boolean(),
})

export type CreateProjectForm = z.infer<typeof FormSchema>

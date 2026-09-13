import { z } from 'zod'

import { DEFAULT_MINIMUM_PASSWORD_STRENGTH } from '@/lib/constants'

export const FormSchema = z
  .object({
    organization: z.string({
      required_error: 'Please select an organization',
    }),
    projectName: z
      .string()
      .trim()
      .min(1, 'Please enter a project name.') // Required field check
      .min(3, 'Project name must be at least 3 characters long.') // Minimum length check
      .max(64, 'Project name must be no longer than 64 characters.'), // Maximum length check
    highAvailability: z.boolean(),
    postgresVersion: z.string({
      required_error: 'Please enter a Postgres version.',
    }),
    instanceType: z.string().optional(),
    dbRegion: z.string({
      required_error: 'Please select a region.',
    }),
    cloudProvider: z.string({
      required_error: 'Please select a cloud provider.',
    }),

    dbPass: z
      .string({ required_error: 'Please enter a database password.' })
      .min(1, 'Password is required.'),
    dbPassStrength: z
      .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .default(0),
    dbPassStrengthMessage: z.string().default(''),
    dbPassStrengthWarning: z.string().default(''),
    instanceSize: z.string().optional(),
    githubRepositoryId: z.string().optional().default(''),
    githubInstallationId: z.number().optional(),
    githubRepositoryName: z.string().optional().default(''),
    dataApi: z.boolean(),
    dataApiDefaultPrivileges: z.boolean(),
    enableRlsEventTrigger: z.boolean(),
    postgresVersionSelection: z.string(),
    useOrioleDb: z.boolean(),
    shouldRunMigrations: z.boolean(),
  })
  .superRefine(
    (
      { dbPassStrength, dbPassStrengthWarning, highAvailability, cloudProvider, useOrioleDb },
      ctx
    ) => {
      if (dbPassStrength < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dbPass'],
          message: dbPassStrengthWarning || 'Password not secure enough',
        })
      }
      if (highAvailability && cloudProvider !== 'AWS_K8S') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cloudProvider'],
          message: 'High availability is only supported on AWS (Revamped)',
        })
      }

      if (highAvailability && useOrioleDb) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['highAvailability'],
          message: 'High availability is not supported with OrioleDB images',
        })
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['useOrioleDb'],
          message: 'High availability is not supported with OrioleDB images',
        })
      }
    }
  )

export type CreateProjectForm = z.infer<typeof FormSchema>

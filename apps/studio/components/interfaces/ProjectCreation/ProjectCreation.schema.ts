import { z } from 'zod'

import { DEFAULT_MINIMUM_PASSWORD_STRENGTH } from '@/lib/constants'
import { passwordStrength } from '@/lib/password-strength'

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
    kubernetesClusterId: z
      .string()
      .trim()
      .transform((value) => (value === '' ? undefined : value))
      .optional(),
    kubernetesClusterForce: z.boolean().optional(),
    dbRegion: z
      .string({ required_error: 'Please select a region.' })
      .trim()
      .min(1, 'Please select a region.'),
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
    async (
      {
        dbPass,
        highAvailability,
        cloudProvider,
        useOrioleDb,
        kubernetesClusterId,
        kubernetesClusterForce,
      },
      ctx
    ) => {
      // DatabasePasswordInput sets dbPassStrength after an async check, so it can still hold an
      // earlier password's score. Score dbPass here instead. Empty passwords already fail .min(1)
      // and skip this, so zxcvbn loads only once a password is entered. A failed load counts as
      // weak, because a rejected promise would leave the form stuck submitting.
      if (dbPass) {
        const { strength, warning } = await passwordStrength(dbPass).catch(() => ({
          strength: 0,
          warning: '',
        }))
        if (strength < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dbPass'],
            message: warning || 'Password not secure enough',
          })
        }
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

      if (kubernetesClusterId && cloudProvider !== 'AWS_K8S' && cloudProvider !== 'AWS_NIMBUS') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['kubernetesClusterId'],
          message:
            'Kubernetes cluster ID is only supported for Kubernetes-architecture cloud providers',
        })
      }

      if (kubernetesClusterForce && !kubernetesClusterId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['kubernetesClusterForce'],
          message: 'Force-deploy has no effect without a Kubernetes cluster ID',
        })
      }
    }
  )

export type CreateProjectForm = z.infer<typeof FormSchema>

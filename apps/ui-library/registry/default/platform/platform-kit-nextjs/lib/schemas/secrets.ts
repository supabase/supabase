import z from 'zod'

export const secretsSchema = z
  .object({
    secrets: z.array(
      z.object({
        name: z
          .string()
          .min(1, 'Secret name is required.')
          .regex(
            /^[a-zA-Z_][a-zA-Z0-9_]*$/,
            'Must contain letters, numbers, and underscores, starting with a letter or underscore.'
          ),
        value: z.string().min(1, 'Secret value is required.'),
      })
    ),
  })
  .describe('Secrets schema for managing environment variables.')

export type SecretsSchema = z.infer<typeof secretsSchema>

export const deleteSecretsSchema = z
  .object({
    secretNames: z
      .array(z.string().min(1, 'Secret name cannot be empty.'))
      .min(1, 'At least one secret name is required.'),
  })
  .describe('Schema for deleting secrets by name.')
export type DeleteSecretsSchema = z.infer<typeof deleteSecretsSchema>

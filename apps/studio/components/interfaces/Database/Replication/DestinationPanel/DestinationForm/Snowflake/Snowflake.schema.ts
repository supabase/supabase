import * as z from 'zod'

export const SnowflakeFormSchema = z.object({
  snowflakeAccountId: z.string().optional(),
  snowflakeUser: z.string().optional(),
  snowflakePrivateKey: z.string().optional(),
  snowflakePrivateKeyPassphrase: z.string().optional(),
  snowflakeDatabase: z.string().optional(),
  snowflakeSchema: z.string().optional(),
  snowflakeRole: z.string().optional(),
})

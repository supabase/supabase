import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ connectionStringPooler, deploymentMode }: StepContentProps) => {
  const envCode = deploymentMode.isCli
    ? `
# Connect to Supabase via direct connection
DATABASE_URL="${connectionStringPooler.direct}"
`
    : deploymentMode.isSelfHosted
      ? `
# Connect to self-hosted Supabase via transaction pooler.
DATABASE_URL="${connectionStringPooler.transactionShared}"
`
      : connectionStringPooler.ipv4SupportedForDedicatedPooler &&
          connectionStringPooler.transactionDedicated
        ? `
DATABASE_URL="${connectionStringPooler.transactionDedicated}"
        `
        : connectionStringPooler.transactionDedicated &&
            !connectionStringPooler.ipv4SupportedForDedicatedPooler
          ? `
# Use Shared connection pooler (supports both IPv4/IPv6)
DATABASE_URL="${connectionStringPooler.transactionShared}"

# If your network supports IPv6 or you purchased IPv4 addon, use dedicated pooler
# DATABASE_URL="${connectionStringPooler.transactionDedicated}"
        `
          : `
DATABASE_URL="${connectionStringPooler.transactionShared}"
`

  const files = [
    {
      name: '.env',
      language: 'bash',
      code: envCode,
    },
    {
      name: 'drizzle/schema.ts',
      language: 'tsx',
      code: `
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});
        `,
    },
    {
      name: 'index.tsx',
      language: 'tsx',
      code: `
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './drizzle/schema'

const connectionString = process.env.DATABASE_URL

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client);

const allUsers = await db.select().from(users);
        `,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile

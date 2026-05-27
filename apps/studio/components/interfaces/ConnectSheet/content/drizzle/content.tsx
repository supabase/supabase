import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ connectionStringPooler, deploymentMode }: StepContentProps) => {
  const envCode = deploymentMode.isCli
    ? `
# Connect to Postgres via the direct connection
DATABASE_URL="${connectionStringPooler.direct}"
`
    : deploymentMode.isSelfHosted
      ? `
# Connect to Postgres via the self-hosted transaction-mode pooler
DATABASE_URL="${connectionStringPooler.transactionShared}"
`
      : connectionStringPooler.transactionDedicated &&
          connectionStringPooler.ipv4SupportedForDedicatedPooler
        ? `
# Connect to Postgres via the dedicated transaction-mode pooler (IPv4-only)
DATABASE_URL="${connectionStringPooler.transactionDedicated}"
        `
        : connectionStringPooler.transactionDedicated &&
            !connectionStringPooler.ipv4SupportedForDedicatedPooler
          ? `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${connectionStringPooler.transactionShared}"

# For paid projects, if your network supports IPv6, or you purchased the IPv4 add-on, use the dedicated transaction-mode pooler as an alternative
# DATABASE_URL="${connectionStringPooler.transactionDedicated}"
        `
          : `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
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

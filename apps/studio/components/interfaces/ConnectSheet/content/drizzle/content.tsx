import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type {
  ConnectionStringPooler,
  DeploymentMode,
  StepContentProps,
} from '@/components/interfaces/ConnectSheet/Connect.types'
import { resolveOrmConnectionScenario } from '@/components/interfaces/ConnectSheet/OrmConnection.utils'
import { TemporaryAccessPasswordNote } from '@/components/interfaces/ConnectSheet/TemporaryAccessRoleField'
import { useIsHighAvailability } from '@/hooks/misc/useSelectedProject'

function getEnvCode({
  connectionStringPooler,
  deploymentMode,
  isHighAvailability,
}: {
  connectionStringPooler: ConnectionStringPooler
  deploymentMode: DeploymentMode
  isHighAvailability: boolean
}): string {
  const scenario = resolveOrmConnectionScenario({
    connectionStringPooler,
    deploymentMode,
    isHighAvailability,
  })

  switch (scenario) {
    case 'cli':
      return `
# Connect to Postgres via the direct connection
DATABASE_URL="${connectionStringPooler.direct}"
`
    case 'self-hosted':
      return `
# Connect to Postgres via the self-hosted transaction-mode pooler
DATABASE_URL="${connectionStringPooler.transactionShared}"
`
    case 'high-availability':
      return `
# Multigres does not support connection pooling — connect to Postgres directly
DATABASE_URL="${connectionStringPooler.direct}"
`
    case 'dedicated-pooler':
      return `
# Connect to Postgres via the dedicated transaction-mode pooler (IPv4-only)
DATABASE_URL="${connectionStringPooler.transactionDedicated}"
        `
    case 'shared-pooler-with-dedicated-alternative':
      return `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${connectionStringPooler.transactionShared}"

# For paid projects, if your network supports IPv6, or you purchased the IPv4 add-on, use the dedicated transaction-mode pooler as an alternative
# DATABASE_URL="${connectionStringPooler.transactionDedicated}"
        `
    case 'shared-pooler':
      return `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${connectionStringPooler.transactionShared}"
`
  }
}

const ContentFile = ({ connectionStringPooler, deploymentMode }: StepContentProps) => {
  const isHighAvailability = useIsHighAvailability()
  const envCode = getEnvCode({ connectionStringPooler, deploymentMode, isHighAvailability })

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

  return (
    <div className="flex flex-col gap-3">
      <MultipleCodeBlock files={files} />
      <TemporaryAccessPasswordNote tokenHref="/account/tokens" />
    </div>
  )
}

export default ContentFile

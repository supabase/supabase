import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ connectionStringPooler, deploymentMode }: StepContentProps) => {
  const envCode = deploymentMode.isCli
    ? `
# Connect to Postgres via the direct connection
DATABASE_URL="${connectionStringPooler.direct}"

# Used for migrations
DIRECT_URL="${connectionStringPooler.direct}"
`
    : deploymentMode.isSelfHosted
      ? `
# Connect to Postgres via the self-hosted transaction-mode Supavisor
DATABASE_URL="${connectionStringPooler.transactionShared}?pgbouncer=true"

# Connect to Postgres via the self-hosted session-mode Supavisor (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"
`
      : connectionStringPooler.transactionDedicated &&
          connectionStringPooler.ipv4SupportedForDedicatedPooler
        ? `
# Connect to Postgres via the dedicated transaction-mode PgBouncer (IPv4 or IPv6)
DATABASE_URL="${connectionStringPooler.transactionDedicated}?pgbouncer=true"

# Connect to Postgres via the dedicated session-mode PgBouncer (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionDedicated}"
        `
        : connectionStringPooler.transactionDedicated &&
            !connectionStringPooler.ipv4SupportedForDedicatedPooler
          ? `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${connectionStringPooler.transactionShared}?pgbouncer=true"

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"

# For a paid project, if your network supports IPv6, or you purchased IPv4 add-on, use the dedicated PgBouncer as an alternative
# DATABASE_URL="${connectionStringPooler.transactionDedicated}?pgbouncer=true"
# DIRECT_URL="${connectionStringPooler.sessionDedicated}"
 `
          : `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${connectionStringPooler.transactionShared}?pgbouncer=true"

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"
`

  const files = [
    {
      name: '.env.local',
      language: 'bash',
      code: envCode,
    },
    {
      name: 'prisma/schema.prisma',
      language: 'bash',
      code: `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
        `,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile

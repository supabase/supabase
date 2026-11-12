import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type {
  ConnectionStringPooler,
  DeploymentMode,
  StepContentProps,
} from '@/components/interfaces/ConnectSheet/Connect.types'
import { appendConnectionStringParams } from '@/components/interfaces/ConnectSheet/ConnectionString.utils'
import { resolveOrmConnectionScenario } from '@/components/interfaces/ConnectSheet/OrmConnection.utils'
import { useIsHighAvailability, useProjectCapabilities } from '@/hooks/misc/useSelectedProject'

const withPgbouncerParam = (uri: string | undefined) =>
  appendConnectionStringParams(uri ?? '', 'pgbouncer=true')

function getEnvCode({
  connectionStringPooler,
  deploymentMode,
  hasConnectionPooling,
}: {
  connectionStringPooler: ConnectionStringPooler
  deploymentMode: DeploymentMode
  hasConnectionPooling: boolean
}): string {
  const scenario = resolveOrmConnectionScenario({
    connectionStringPooler,
    deploymentMode,
    hasConnectionPooling,
  })

  switch (scenario) {
    case 'cli':
      return `
# Connect to Postgres via the direct connection
DATABASE_URL="${connectionStringPooler.direct}"

# Used for migrations
DIRECT_URL="${connectionStringPooler.direct}"
`
    case 'self-hosted':
      return `
# Connect to Postgres via the self-hosted transaction-mode pooler
DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionShared)}"

# Connect to Postgres via the self-hosted session-mode pooler (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"
`
    case 'no-pooler':
      return `
# Multigres and Multigres Lite do not support connection pooling — connect to Postgres directly
DATABASE_URL="${connectionStringPooler.direct}"

# Used for migrations
DIRECT_URL="${connectionStringPooler.direct}"
`
    case 'dedicated-pooler':
      return `
# Connect to Postgres via the dedicated transaction-mode pooler (IPv4-only)
DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionDedicated)}"

# Connect to Postgres directly (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionDedicated}"
        `
    case 'shared-pooler-with-dedicated-alternative':
      return `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionShared)}"

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"

# For paid projects, if your network supports IPv6, or you purchased the IPv4 add-on, use the dedicated transaction-mode pooler with a direct connection to Postgres for migrations as an alternative
# DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionDedicated)}"
# DIRECT_URL="${connectionStringPooler.sessionDedicated}"
 `
    case 'shared-pooler':
      return `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionShared)}"

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"
`
  }
}

const ContentFile = ({ connectionStringPooler, deploymentMode }: StepContentProps) => {
  const isHighAvailability = useIsHighAvailability()
  const capabilities = useProjectCapabilities()
  // Fall back to the pre-capabilities `isHighAvailability` check (rather than
  // a fixed default) so behavior for already-correct HA projects doesn't
  // regress while the backend capabilities field is still rolling out.
  const hasConnectionPooling = capabilities?.hasConnectionPooling ?? !isHighAvailability
  const envCode = getEnvCode({ connectionStringPooler, deploymentMode, hasConnectionPooling })

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

import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type {
  ConnectionStringPooler,
  DeploymentMode,
  StepContentProps,
} from '@/components/interfaces/ConnectSheet/Connect.types'
import { appendConnectionStringParams } from '@/components/interfaces/ConnectSheet/ConnectionString.utils'
import { useIsHighAvailability } from '@/hooks/misc/useSelectedProject'

const withPgbouncerParam = (uri: string | undefined) =>
  appendConnectionStringParams(uri ?? '', 'pgbouncer=true')

function getEnvCode({
  connectionStringPooler,
  deploymentMode,
  isHighAvailability,
}: {
  connectionStringPooler: ConnectionStringPooler
  deploymentMode: DeploymentMode
  isHighAvailability: boolean
}): string {
  if (deploymentMode.isCli) {
    return `
# Connect to Postgres via the direct connection
DATABASE_URL="${connectionStringPooler.direct}"

# Used for migrations
DIRECT_URL="${connectionStringPooler.direct}"
`
  }

  if (deploymentMode.isSelfHosted) {
    return `
# Connect to Postgres via the self-hosted transaction-mode pooler
DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionShared)}"

# Connect to Postgres via the self-hosted session-mode pooler (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"
`
  }

  if (isHighAvailability) {
    return `
# Multigres does not support connection pooling — connect to Postgres directly
DATABASE_URL="${connectionStringPooler.direct}"

# Used for migrations
DIRECT_URL="${connectionStringPooler.direct}"
`
  }

  if (
    connectionStringPooler.transactionDedicated &&
    connectionStringPooler.ipv4SupportedForDedicatedPooler
  ) {
    return `
# Connect to Postgres via the dedicated transaction-mode pooler (IPv4-only)
DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionDedicated)}"

# Connect to Postgres directly (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionDedicated}"
        `
  }

  if (
    connectionStringPooler.transactionDedicated &&
    !connectionStringPooler.ipv4SupportedForDedicatedPooler
  ) {
    return `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionShared)}"

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"

# For paid projects, if your network supports IPv6, or you purchased the IPv4 add-on, use the dedicated transaction-mode pooler with a direct connection to Postgres for migrations as an alternative
# DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionDedicated)}"
# DIRECT_URL="${connectionStringPooler.sessionDedicated}"
 `
  }

  return `
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="${withPgbouncerParam(connectionStringPooler.transactionShared)}"

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="${connectionStringPooler.sessionShared}"
`
}

const ContentFile = ({ connectionStringPooler, deploymentMode }: StepContentProps) => {
  const isHighAvailability = useIsHighAvailability()
  const envCode = getEnvCode({ connectionStringPooler, deploymentMode, isHighAvailability })

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

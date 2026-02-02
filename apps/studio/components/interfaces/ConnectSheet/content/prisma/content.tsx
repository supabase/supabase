import { IS_PLATFORM } from 'lib/constants'
import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ connectionStringPooler }: ContentFileProps) => {
  const files = [
    {
      name: '.env.local',
      language: 'bash',
      code:
        connectionStringPooler.ipv4SupportedForDedicatedPooler &&
        connectionStringPooler.transactionDedicated
          ? `
# Connect to Supabase via connection pooling.
DATABASE_URL="${connectionStringPooler.transactionDedicated}?pgbouncer=true"

# Direct connection to the database. Used for migrations.
DIRECT_URL="${connectionStringPooler.sessionDedicated}"
        `
          : connectionStringPooler.transactionDedicated &&
              !connectionStringPooler.ipv4SupportedForDedicatedPooler
            ? `
# Connect to Supabase via Shared Connection Pooler
DATABASE_URL="${connectionStringPooler.transactionShared}?pgbouncer=true"

# Direct connection to the database through Shared Pooler (supports IPv4/IPv6). Used for migrations.
DIRECT_URL="${connectionStringPooler.sessionShared}"

# If your network supports IPv6 or you purchased IPv4 addon, use dedicated pooler
# DATABASE_URL="${connectionStringPooler.transactionDedicated}?pgbouncer=true"
# DIRECT_URL="${connectionStringPooler.sessionDedicated}"
 `
            : `
# Connect to Supabase ${IS_PLATFORM ? 'via connection pooling' : ''}
DATABASE_URL="${IS_PLATFORM ? `${connectionStringPooler.transactionShared}?pgbouncer=true` : connectionStringPooler.direct}"

# Direct connection to the database. Used for migrations
DIRECT_URL="${IS_PLATFORM ? connectionStringPooler.sessionShared : connectionStringPooler.direct}"
`,
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

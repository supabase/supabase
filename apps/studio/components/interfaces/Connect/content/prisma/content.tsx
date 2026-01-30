import type { ContentFileProps } from 'components/interfaces/Connect/Connect.types'

import { SimpleCodeBlock } from 'ui'
import {
  ConnectTabContent,
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
} from 'components/interfaces/Connect/ConnectTabs'
import { IS_PLATFORM } from 'lib/constants'

const ContentFile = ({ connectionStringPooler, isCliMode }: ContentFileProps) => {
  // CLI mode uses direct connection (postgres directly accessible)
  // Self-hosted and platform use pooler connections
  const useDirectConnection = isCliMode
  const isSelfHosted = !IS_PLATFORM && !isCliMode

  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="prisma/schema.prisma" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {useDirectConnection
            ? `
# Connect to Supabase via direct connection
DATABASE_URL="${connectionStringPooler.direct}"
`
            : isSelfHosted
              ? `
# Connect to self-hosted Supabase via transaction pooler.
DATABASE_URL="${connectionStringPooler.transactionShared}?pgbouncer=true"

# Connect to self-hosted Supabase via session pooler. Used for migrations.
DIRECT_URL="${connectionStringPooler.sessionShared}"
`
              : connectionStringPooler.ipv4SupportedForDedicatedPooler &&
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
# Connect to Supabase via connection pooling
DATABASE_URL="${connectionStringPooler.transactionShared}?pgbouncer=true"

# Direct connection to the database through Shared Pooler. Used for migrations.
DIRECT_URL="${connectionStringPooler.sessionShared}"
`}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="prisma/schema.prisma">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile

import type { ContentFileProps } from 'components/interfaces/Connect/Connect.types'

import { SimpleCodeBlock } from 'ui'
import {
  ConnectTabContent,
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
} from 'components/interfaces/Connect/ConnectTabs'
import { IS_PLATFORM } from 'lib/constants'

const ContentFile = ({ connectionStringPooler }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="prisma/schema.prisma" />
        <ConnectTabTrigger value="prisma.config.ts" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {connectionStringPooler.ipv4SupportedForDedicatedPooler &&
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
  provider = "postgresql"
}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="prisma.config.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Prisma CLI migrations should use DIRECT_URL (session/direct connection)
    url: env('DIRECT_URL'),
  },
})
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile

import { SimpleCodeBlock } from 'ui-patterns/SimpleCodeBlock'

import type { ContentFileProps } from '@/components/interfaces/Connect/Connect.types'
import {
  ConnectTabContent,
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
} from '@/components/interfaces/Connect/ConnectTabs'
import { IS_PLATFORM } from '@/lib/constants'

const ContentFile = ({
  connectionStringPooler,
  isSelfHosted,
}: ContentFileProps) => {
  const isPlatform = IS_PLATFORM

  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="prisma/schema.prisma" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {connectionStringPooler.transactionDedicated
            ? `
# Connect to Supabase via connection pooling.
DATABASE_URL="${connectionStringPooler.transactionDedicated}?pgbouncer=true"

# Direct connection to the database. Used for migrations.
DIRECT_URL="${connectionStringPooler.sessionDedicated}"
        `
            : `
# Connect to Supabase ${isPlatform ? 'via connection pooling' : ''}
DATABASE_URL="${
                isPlatform
                  ? `${connectionStringPooler.transactionShared}?pgbouncer=true`
                  : isSelfHosted
                    ? connectionStringPooler.sessionShared // Use session pooler for self-hosted by default
                    : connectionStringPooler.direct
              }"

# Direct connection to the database. Used for migrations
DIRECT_URL="${
                isPlatform
                  ? connectionStringPooler.sessionShared
                  : isSelfHosted
                    ? `${connectionStringPooler.direct} // Manually configurable`
                    : connectionStringPooler.direct
              }"
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

import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

import { IS_PLATFORM } from 'lib/constants'
import { SimpleCodeBlock } from 'ui'
import {
  MultipleCodeBlock,
  MultipleCodeBlockContent,
  MultipleCodeBlockTrigger,
  MultipleCodeBlockTriggers,
} from 'ui-patterns/multiple-code-block'

const ContentFile = ({ connectionStringPooler }: ContentFileProps) => {
  return (
    <MultipleCodeBlock>
      <MultipleCodeBlockTriggers>
        <MultipleCodeBlockTrigger value=".env.local" />
        <MultipleCodeBlockTrigger value="prisma/schema.prisma" />
      </MultipleCodeBlockTriggers>

      <MultipleCodeBlockContent value=".env.local">
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
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="prisma/schema.prisma">
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
      </MultipleCodeBlockContent>
    </MultipleCodeBlock>
  )
}

export default ContentFile

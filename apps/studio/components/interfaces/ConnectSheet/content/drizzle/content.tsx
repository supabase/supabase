import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

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
        <MultipleCodeBlockTrigger value=".env" />
        <MultipleCodeBlockTrigger value="drizzle/schema.tsx" />
        <MultipleCodeBlockTrigger value="index.tsx" />
      </MultipleCodeBlockTriggers>

      <MultipleCodeBlockContent value=".env">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {connectionStringPooler.ipv4SupportedForDedicatedPooler &&
          connectionStringPooler.transactionDedicated
            ? `
DATABASE_URL="${connectionStringPooler.transactionDedicated}"
        `
            : connectionStringPooler.transactionDedicated &&
                !connectionStringPooler.ipv4SupportedForDedicatedPooler
              ? `
# Use Shared connection pooler (supports both IPv4/IPv6)
DATABASE_URL="${connectionStringPooler.transactionShared}"

# If your network supports IPv6 or you purchased IPv4 addon, use dedicated pooler
# DATABASE_URL="${connectionStringPooler.transactionDedicated}"
        `
              : `
DATABASE_URL="${connectionStringPooler.transactionShared}"
`}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="drizzle/schema.tsx">
        <SimpleCodeBlock className="tsx" parentClassName="min-h-72">
          {`
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});
        `}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="index.tsx">
        <SimpleCodeBlock className="tsx" parentClassName="min-h-72">
          {`
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './schema'

const connectionString = process.env.DATABASE_URL

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client);

const allUsers = await db.select().from(users);
        `}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>
    </MultipleCodeBlock>
  )
}

export default ContentFile

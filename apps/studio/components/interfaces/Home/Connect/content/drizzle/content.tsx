import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'
import { ConnectTabContent } from 'components/interfaces/Home/Connect/ConnectFilesContent'
import {
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env" />
        <ConnectTabTrigger value="schema.tsx" />
        <ConnectTabTrigger value="index.tsx" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env" location=".env">
        <SimpleCodeBlock className="bash">
          {`
DATABASE_URL='your-database-url'
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="schema.tsx" location="drizzle/schema.tsx">
        <SimpleCodeBlock className="javascript">
          {`
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="index.tsx" location="index.tsx">
        <SimpleCodeBlock className="javascript">
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
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile

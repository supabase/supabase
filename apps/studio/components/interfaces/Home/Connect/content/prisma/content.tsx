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
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="schema.prisma" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local" location=".env.local">
        <SimpleCodeBlock className="bash">
          {`
# Connect to Supabase via connection pooling with Supavisor.
DATABASE_URL="postgres://postgres.[your-supabase-project]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations.
DIRECT_URL="postgres://postgres:[password]@db.[your-supabase-project].supabase.co:5432/postgres"
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="schema.prisma" location="prisma/schema.prisma">
        <SimpleCodeBlock className="bash">
          {`
datasource db {
  provider  = "postgresql"
  url       = env(${projectKeys.apiUrl ?? '"DATABASE_URL"'})
  directUrl = env(${projectKeys.apiUrl ?? '"DIRECT_URL"'})
}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile

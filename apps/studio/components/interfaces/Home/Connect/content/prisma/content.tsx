import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'

import {
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
  ConnectTabContent,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectRef, region }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="prisma/schema.prisma" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
# Connect to Supabase via connection pooling with Supavisor.
DATABASE_URL="postgres://postgres.${projectRef}:[password]@aws-0-${region}.pooler.supabase.com:6543/postgres"

# OR if you want to use direct connection to the database. Used for migrations.
DATABASE_URL="postgres://postgres:[password]@db.${projectRef}.supabase.co:5432/postgres"
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="prisma/schema.prisma">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
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

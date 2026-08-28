import { useParams } from 'common'
import Image from 'next/image'

import { InlineLink } from '@/components/ui/InlineLink'
import { BASE_PATH } from '@/lib/constants'

export const DatabaseConnectionsPreview = () => {
  const { ref = '_' } = useParams()

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-light">
        See every session on your database in real time, spot the ones that are slow, idle in a
        transaction, or blocked, and terminate the one holding things up - all from{' '}
        <InlineLink href={`/project/${ref}/observability/connections`}>
          Database Connections
        </InlineLink>
        .
      </p>

      <Image
        alt="database-connections-preview"
        src={`${BASE_PATH}/img/previews/database-connections-preview.png`}
        width={1200}
        height={626}
        className="rounded-sm border mb-4"
      />

      <div className="space-y-2">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Show live connection, query, and locking activity for your database</li>
          <li>Flag queries that are idle in transaction, long-running, or blocked</li>
          <li>Trace a blocked query back to the session actually holding the lock</li>
          <li>Let you terminate a stuck session directly from the table</li>
          <li>Summarize current activity on demand using the AI Assistant</li>
        </ul>
      </div>
    </div>
  )
}

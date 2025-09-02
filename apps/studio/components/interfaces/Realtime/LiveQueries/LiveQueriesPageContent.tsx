import { useState } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import LiveQueriesTable from './LiveQueriesTable'
import { LiveQuerySheet } from './LiveQuerySheet'
import { Button } from 'ui'

export const LiveQueriesPageContent = () => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)

  return (
    <PageLayout
      size="full"
      title="Live Queries"
      breadcrumbs={[
        { label: 'Realtime', href: `/project/${ref}/realtime/inspector` },
        { label: 'Live Queries' },
      ]}
      primaryActions={
        <Button type="primary" onClick={() => setOpen(true)}>
          Add Query
        </Button>
      }
    >
      <LiveQueriesTable />
      <LiveQuerySheet open={open} onOpenChange={setOpen} />
    </PageLayout>
  )
}

export default LiveQueriesPageContent

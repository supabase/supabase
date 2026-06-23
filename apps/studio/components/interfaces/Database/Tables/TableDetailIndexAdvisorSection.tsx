import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  TableIndexAdvisorProvider,
  useTableIndexAdvisor,
} from '@/components/grid/context/TableIndexAdvisorContext'
import { EnableIndexAdvisorDialog } from '@/components/interfaces/QueryPerformance/IndexAdvisor/EnableIndexAdvisorButton'
import { useIndexAdvisorStatus } from '@/components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { useTrack } from '@/lib/telemetry/track'
import type { TableLike } from '@/data/table-editor/table-editor-types'

interface TableDetailIndexAdvisorSectionProps {
  table: TableLike
}

function TableDetailIndexAdvisorContent() {
  const track = useTrack()
  const { ref } = useParams()
  const [enableDialogOpen, setEnableDialogOpen] = useState(false)
  const { isIndexAdvisorAvailable, isIndexAdvisorEnabled } = useIndexAdvisorStatus()
  const { columnsWithSuggestions, isLoading } = useTableIndexAdvisor()

  if (!isIndexAdvisorAvailable) return null

  if (!isIndexAdvisorEnabled) {
    return (
      <>
        <FormLayout
          isReactForm={false}
          label="Index Advisor"
          description="Recommends indexes to improve query performance based on your query patterns."
          layout="flex-row-reverse"
        >
          <Button
            variant="default"
            onClick={() => {
              setEnableDialogOpen(true)
              track('index_advisor_enable_button_clicked', { origin: 'table_settings' })
            }}
          >
            Enable
          </Button>
        </FormLayout>
        <EnableIndexAdvisorDialog open={enableDialogOpen} setOpen={setEnableDialogOpen} />
      </>
    )
  }

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  const suggestionCount = columnsWithSuggestions.length

  return (
    <FormLayout
      isReactForm={false}
      label="Index Advisor"
      description={
        suggestionCount > 0
          ? `${suggestionCount} column${suggestionCount === 1 ? '' : 's'} with index recommendations based on query patterns.`
          : 'Enabled. Recommendations will appear as query patterns are analyzed.'
      }
      layout="flex-row-reverse"
    >
      <Button asChild variant="default">
        <Link href={`/project/${ref}/observability/query-performance`}>View recommendations</Link>
      </Button>
    </FormLayout>
  )
}

export function TableDetailIndexAdvisorSection({ table }: TableDetailIndexAdvisorSectionProps) {
  const { isIndexAdvisorAvailable } = useIndexAdvisorStatus()

  if (!isIndexAdvisorAvailable) return null

  return (
    <TableIndexAdvisorProvider schema={table.schema} table={table.name}>
      <Card>
        <CardContent>
          <TableDetailIndexAdvisorContent />
        </CardContent>
      </Card>
    </TableIndexAdvisorProvider>
  )
}

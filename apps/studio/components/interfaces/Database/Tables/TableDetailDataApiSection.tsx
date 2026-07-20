import { Card, CardContent } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  ApiAccessToggle,
  useTableApiAccessHandlerWithHistory,
} from '@/components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/ApiAccessToggle'
import type { TableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface TableDetailDataApiSectionProps {
  table: TableLike
}

export function TableDetailDataApiSection({ table }: TableDetailDataApiSectionProps) {
  const { data: project } = useSelectedProjectQuery()
  const handler = useTableApiAccessHandlerWithHistory({
    type: 'edit',
    schemaName: table.schema,
    tableName: table.name,
  })

  if (handler.isPending) {
    return <GenericSkeletonLoader />
  }

  return (
    <Card>
      <CardContent>
        <ApiAccessToggle
          projectRef={project?.ref}
          schemaName={table.schema}
          tableName={table.name}
          isNewRecord={false}
          handler={handler}
          hideHeading
        />
      </CardContent>
    </Card>
  )
}

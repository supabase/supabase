import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { getSourceTableKey } from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'
import { buildTableDetailUrl } from '@/components/interfaces/Database/Warehouse/warehouseTableEditor.utils'
import { WarehouseTableStoragePanel } from '@/components/interfaces/Database/Warehouse/WarehouseTableStoragePanel'
import type { TableLike } from '@/data/table-editor/table-editor-types'

interface WarehouseTableDetailStorageTabProps {
  table: TableLike
}

export function WarehouseTableDetailStorageTab({ table }: WarehouseTableDetailStorageTabProps) {
  const { ref: projectRef } = useParams()
  const tableKey = getSourceTableKey(table.schema, table.name)
  const postgresSettingsUrl =
    projectRef !== undefined
      ? buildTableDetailUrl(projectRef, table.id, { section: 'settings' })
      : undefined

  return (
    <>
      <Admonition
        type="default"
        layout="responsive"
        title="Manage settings from the main table"
        description="This table is a Warehouse copy of a Postgres table. Manage settings for both from the main table’s Settings page."
        actions={
          <Button variant="default" asChild>
            <Link href={postgresSettingsUrl}>Table settings</Link>
          </Button>
        }
      />

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Storage</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <WarehouseTableStoragePanel
            tableKey={tableKey}
            tableId={table.id}
            warehouseSize={table.size}
            viewContext="warehouse"
          />
        </PageSectionContent>
      </PageSection>
    </>
  )
}

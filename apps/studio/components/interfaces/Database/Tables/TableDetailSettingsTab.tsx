import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { TableDetailDeleteTableSection } from '@/components/interfaces/Database/Tables/TableDetailDeleteTableSection'
import { TableDetailGeneralSettingsCard } from '@/components/interfaces/Database/Tables/TableDetailGeneralSettingsCard'
import { TableDetailIndexAdvisorSection } from '@/components/interfaces/Database/Tables/TableDetailIndexAdvisorSection'
import { getSourceTableKey } from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'
import { WarehouseTableStoragePanel } from '@/components/interfaces/Database/Warehouse/WarehouseTableStoragePanel'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { TableLike } from '@/data/table-editor/table-editor-types'

interface TableDetailSettingsTabProps {
  table: TableLike
}

export function TableDetailSettingsTab({ table }: TableDetailSettingsTabProps) {
  const showStorage = table.entity_type === ENTITY_TYPE.TABLE
  const tableKey = getSourceTableKey(table.schema, table.name)

  return (
    <div className="flex flex-col gap-8">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>General</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <TableDetailGeneralSettingsCard table={table} />
        </PageSectionContent>
      </PageSection>

      {showStorage && (
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
              postgresSize={table.size}
              viewContext="source"
            />
          </PageSectionContent>
        </PageSection>
      )}

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Index Advisor</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <TableDetailIndexAdvisorSection table={table} />
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Delete table</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <TableDetailDeleteTableSection table={table} />
        </PageSectionContent>
      </PageSection>
    </div>
  )
}

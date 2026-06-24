import { Realtime } from 'icons'
import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { TableDetailGeneralSettingsCard } from '@/components/interfaces/Database/Tables/TableDetailGeneralSettingsCard'
import { TableDetailDataApiSection } from '@/components/interfaces/Database/Tables/TableDetailDataApiSection'
import { TableDetailDeleteTableSection } from '@/components/interfaces/Database/Tables/TableDetailDeleteTableSection'
import { TableDetailIndexAdvisorSection } from '@/components/interfaces/Database/Tables/TableDetailIndexAdvisorSection'
import { WarehouseTableStoragePanel } from '@/components/interfaces/Database/Warehouse/WarehouseTableStoragePanel'
import { RealtimeToggleDialog } from '@/components/interfaces/TableGridEditor/RealtimeToggleDialog'
import { useIsTableRealtimeEnabled } from '@/data/database-publications/database-publications-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { TableLike } from '@/data/table-editor/table-editor-types'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

interface TableDetailSettingsTabProps {
  table: TableLike
}

export function TableDetailSettingsTab({ table }: TableDetailSettingsTabProps) {
  const [realtimeDialogOpen, setRealtimeDialogOpen] = useState(false)
  const { realtimeAll: isRealtimeFeatureEnabled } = useIsFeatureEnabled(['realtime:all'])
  const isRealtimeEnabled = useIsTableRealtimeEnabled({ id: table.id })
  const showStorage = table.entity_type === ENTITY_TYPE.TABLE
  const tableKey = `${table.schema}.${table.name}`

  return (
    <>
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
              <WarehouseTableStoragePanel tableKey={tableKey} postgresSize={table.size} />
            </PageSectionContent>
          </PageSection>
        )}

        {isRealtimeFeatureEnabled && (
          <PageSection>
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Realtime</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent>
              <Card>
                <CardContent>
                  <FormLayout
                    isReactForm={false}
                    label="Realtime"
                    description="Broadcast changes on this table to authorized subscribers."
                    layout="flex-row-reverse"
                  >
                    <Button
                      variant="default"
                      icon={<Realtime size={14} className={isRealtimeEnabled ? 'text-brand' : ''} />}
                      onClick={() => setRealtimeDialogOpen(true)}
                    >
                      {isRealtimeEnabled ? 'Disable' : 'Enable'} realtime
                    </Button>
                  </FormLayout>
                </CardContent>
              </Card>
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
              <PageSectionTitle>Data API access</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <TableDetailDataApiSection table={table} />
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

      <RealtimeToggleDialog
        table={table}
        open={realtimeDialogOpen}
        setOpen={setRealtimeDialogOpen}
      />
    </>
  )
}

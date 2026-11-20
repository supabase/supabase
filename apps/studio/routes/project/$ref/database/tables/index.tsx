import { createFileRoute } from '@tanstack/react-router'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { TableList } from '@/components/interfaces/Database/Tables/TableList'
import { DeleteConfirmationDialogs } from '@/components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { useTableActions } from '@/components/interfaces/TableGridEditor/useTableActions'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { AutoEnableRLSNotice } from '@/components/ui/AutoEnableRLSNotice'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

export const Route = createFileRoute('/project/$ref/database/tables/')({
  component: DatabaseTables,
  staticData: {
    databaseLayoutTitle: 'Tables',
  },
})

function DatabaseTables() {
  const { ref: projectRef } = useParams()
  const snap = useTableEditorStateSnapshot()
  const { editTable, duplicateTable, deleteTable } = useTableActions()

  const [isAutoEnableRLSMinimized] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.RLS_EVENT_TRIGGER_BANNER_DISMISSED(projectRef ?? ''),
    false
  )

  return (
    <>
      <PageLayout
        title="Database Tables"
        size="large"
        primaryActions={isAutoEnableRLSMinimized && <AutoEnableRLSNotice iconOnly />}
      >
        <PageContainer size="large">
          <PageSection>
            {!isAutoEnableRLSMinimized && <AutoEnableRLSNotice />}

            <PageSectionContent>
              <TableList
                onAddTable={snap.onAddTable}
                onEditTable={(table) => editTable(table.id)}
                onDeleteTable={(table) => deleteTable(table.id)}
                onDuplicateTable={(table) => duplicateTable(table.id)}
              />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      </PageLayout>

      <DeleteConfirmationDialogs />
      <SidePanelEditor includeColumns />
    </>
  )
}

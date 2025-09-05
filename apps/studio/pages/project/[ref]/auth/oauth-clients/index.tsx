import { PostgresTable } from '@supabase/postgres-meta'
import { useState } from 'react'

import { useParams } from 'common'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { Entity } from 'data/table-editor/table-editor-types'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { NextPageWithLayout } from 'types'
import OAuthAppsList from 'components/interfaces/Auth/OAuthApps/OAuthAppsList/OAuthAppsList'

const OAuthApps: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const snap = useTableEditorStateSnapshot()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<Entity>()

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="OAuth Clients" />
            <OAuthAppsList
              createTrigger={() => null}
              editTrigger={() => null}
              deleteTrigger={() => null}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      {/* 
      {projectRef !== undefined &&
        selectedTableToEdit !== undefined &&
        isTableLike(selectedTableToEdit) && (
          <TableEditorTableStateContextProvider
            key={`table-editor-table-${selectedTableToEdit.id}`}
            projectRef={projectRef}
            table={selectedTableToEdit}
          >
            <DeleteConfirmationDialogs selectedTable={selectedTableToEdit} />
          </TableEditorTableStateContextProvider>
        )} */}

      <SidePanelEditor includeColumns selectedTable={selectedTableToEdit as PostgresTable} />
    </>
  )
}

OAuthApps.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default OAuthApps

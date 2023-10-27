import Link from 'next/link'
import { useCallback, useState } from 'react'

import { useParams } from 'common/hooks'
import { rlsAcknowledgedKey } from 'components/grid/constants'
import RLSDisableModalContent from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/RLSDisableModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useTableQuery } from 'data/tables/table-query'
import useEntityType from 'hooks/misc/useEntityType'
import { Button, IconAlertCircle, Modal } from 'ui'

export default function RLSBannerWarning() {
  const { project } = useProjectContext()
  const { ref: projectRef, id: _id } = useParams()
  const tableID = _id ? Number(_id) : undefined

  const rlsKey = rlsAcknowledgedKey(tableID)
  const isAcknowledged = localStorage?.getItem(rlsKey) === 'true' ?? false

  const [isOpen, setIsOpen] = useState(false)

  const entityType = useEntityType(tableID)
  const { data: currentTable } = useTableQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: tableID,
    },
    {
      enabled: entityType?.type === ENTITY_TYPE.TABLE,
    }
  )

  const rlsEnabled = currentTable?.rls_enabled
  const isPublicTable = currentTable?.schema === 'public'

  const handleDismissWarning = useCallback(() => {
    new BroadcastChannel(rlsKey).postMessage({ type: 'dismiss' })
    localStorage.setItem(rlsKey, 'true')
    setIsOpen(false)
  }, [rlsKey])

  return (
    <>
      {!isAcknowledged && !rlsEnabled && isPublicTable ? (
        <div>
          <div className="text-center text-xs py-2.5 flex items-center justify-center relative">
            <IconAlertCircle size={16} strokeWidth={2} />
            <span className="font-bold mx-2">Table is public</span> You are allowing anonymous
            access to your data.{' '}
            <Link passHref href={`/project/${projectRef}/auth/policies?search=${tableID}`}>
              <a className="underline ml-2 opacity-80 hover:opacity-100 transition">
                Enable Row Level Security
              </a>
            </Link>
            <div className="ml-20 absolute right-2">
              <Button
                type="outline"
                className="hover:text-foreground"
                onClick={() => setIsOpen(true)}
              >
                Dismiss
              </Button>
            </div>
          </div>

          <ConfirmationModal
            visible={isOpen}
            header="Turn off Row Level Security"
            buttonLabel="Confirm"
            size="medium"
            onSelectCancel={() => setIsOpen(false)}
            onSelectConfirm={handleDismissWarning}
          >
            <Modal.Content>
              <RLSDisableModalContent />
            </Modal.Content>
          </ConfirmationModal>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

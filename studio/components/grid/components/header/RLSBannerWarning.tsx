import { useCallback, useState } from 'react'
import { Button, IconAlertCircle, Modal } from 'ui'
import Link from 'next/link'
import { useStore } from 'hooks'
import { useParams } from 'common/hooks'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import type { PostgresTable } from '@supabase/postgres-meta'
import { rlsAcknowledgedKey } from 'components/grid/constants'
import RLSDisableModalContent from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/RLSDisableModal'

export default function RLSBannerWarning() {
  const { meta } = useStore()
  const { ref: projectRef, id: tableID } = useParams()

  const rlsKey = rlsAcknowledgedKey(tableID)
  const isAcknowledged = localStorage?.getItem(rlsKey) === 'true' ?? false

  const [isOpen, setIsOpen] = useState(false)

  const tables: PostgresTable[] = meta.tables.list()
  const currentTable = tables.find((table) => table.id.toString() === tableID)
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
          <div className="text-center bg-amber-500 text-amber-1100 dark:text-amber-900 text-xs py-2.5 flex items-center justify-center relative">
            <IconAlertCircle size={16} strokeWidth={2} />
            <span className="uppercase font-bold ml-2">Warning</span>: You are allowing anonymous
            access to your table.{' '}
            <Link href={`/project/${projectRef}/auth/policies?search=${tableID}`}>
              <a className="underline ml-2 opacity-80 hover:opacity-100 transition">
                Enable Row Level Security
              </a>
            </Link>
            <div className="ml-20 absolute right-2">
              <Button
                type="outline"
                className="hover:text-scale-1200 text-amber-900 dark:text-amber-900 border border-amber-800"
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

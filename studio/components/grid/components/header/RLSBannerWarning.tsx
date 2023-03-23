import { useState } from 'react'
import { Button, IconAlertCircle, IconExternalLink, Modal } from 'ui'
import Link from 'next/link'
import { useParams, useStore } from 'hooks'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import type { PostgresTable } from '@supabase/postgres-meta'

const RLS_ACKNOWLEDGED_KEY = 'supabase-acknowledge-rls-warning'

export default function RLSBannerWarning() {
  const { meta } = useStore()
  const { ref: projectRef, id: tableID } = useParams()

  const isAcknowledged = localStorage.getItem(`${RLS_ACKNOWLEDGED_KEY}-${tableID}`) === 'true'

  const [isOpen, setIsOpen] = useState(false)

  const tables: PostgresTable[] = meta.tables.list()
  const currentTable = tables.find((table) => table.id.toString() === tableID)
  const rlsEnabled = currentTable?.rls_enabled
  const isPublicTable = currentTable?.schema === 'public'

  function handleDismissWarning() {
    localStorage.setItem(`${RLS_ACKNOWLEDGED_KEY}-${tableID}`, 'true')
    setIsOpen(false)
  }

  return (
    <>
      {!isAcknowledged && !rlsEnabled && isPublicTable ? (
        <div>
          <div className="text-center bg-amber-500 text-amber-900 text-xs py-2.5 flex items-center justify-center relative">
            <IconAlertCircle size={16} strokeWidth={2} />
            <span className="uppercase font-bold ml-2">Warning</span>: This table is publicly
            readable and writable.{' '}
            <Link href={`/project/${projectRef}/auth/policies?search=${tableID}`}>
              <a className="underline ml-2 opacity-80 hover:opacity-100 transition">
                Enable Row Level Security
              </a>
            </Link>
            <div className="ml-20 absolute right-2">
              <Button
                type="outline"
                className="text-white hover:text-scale-1200"
                onClick={() => setIsOpen(true)}
              >
                Dismiss
              </Button>
            </div>
          </div>

          <ConfirmationModal
            danger
            visible={isOpen}
            header="Warning: Your data is public"
            buttonLabel="I understand, dismiss this warning"
            onSelectCancel={() => setIsOpen(false)}
            onSelectConfirm={handleDismissWarning}
            children={
              <Modal.Content>
                <div className="mt-4 mb-6 space-y-4">
                  <p className="text-sm text-scale-1100">
                    Data in this table is publicly <u>readable and writable</u> by anyone with the
                    anon key. We strongly recommend creating RLS (Row-Level Security) policies to
                    allow access to this table.
                  </p>
                  <div>
                    <Link href="https://supabase.com/docs/guides/auth/row-level-security">
                      <a target="_blank">
                        <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                          About RLS Policies
                        </Button>
                      </a>
                    </Link>
                  </div>
                </div>
              </Modal.Content>
            }
          />
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

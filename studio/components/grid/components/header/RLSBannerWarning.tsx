import React, { useState } from 'react'
import { Button, IconAlertCircle, IconBookOpen, Modal } from 'ui'
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
          <div className="text-center bg-red-900 text-white text-xs py-2 flex items-center justify-center">
            <IconAlertCircle />
            <span className="uppercase font-bold ml-2">Warning</span>: this table is publicly
            readable and writable.{' '}
            <Link href={`/project/${projectRef}/auth/policies#${tableID}`}>
              <a className="underline ml-2">Enable Row Level Security</a>
            </Link>
            <div className="ml-20">
              <Button
                type="text"
                className="text-white hover:text-scale-1200"
                onClick={() => setIsOpen(true)}
              >
                Dismiss
              </Button>
            </div>
          </div>

          <ConfirmationModal
            visible={isOpen}
            danger={true}
            header="Confirm"
            buttonLabel="I understand, dismiss this warning"
            onSelectCancel={() => setIsOpen(false)}
            onSelectConfirm={handleDismissWarning}
            children={
              <Modal.Content>
                <div className="grid gap-3 mt-4 mb-6">
                  <h4 className="text-base">Warning: your data is public</h4>
                  <p className="text-sm text-scale-1100">
                    Data in this table is publicly <u>readable and writable</u> by anyone with the
                    anon key. We strongly recommend creating RLS (Row-Level Security) policies to
                    allow access to this table.
                  </p>
                  <div className="grid gap-3 pt-4">
                    <p className="text-sm text-scale-1100">
                      Read more about setting up RLS Policies:
                    </p>
                    <p>
                      <Link href="https://supabase.com/docs/guides/auth/row-level-security">
                        <a target="_blank">
                          <Button type="default" icon={<IconBookOpen strokeWidth={1.5} />}>
                            Documentation
                          </Button>
                        </a>
                      </Link>
                    </p>
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

import { useState } from 'react'
import {
  Alert,
  Button,
  IconAlertCircle,
  IconBookOpen,
  IconExternalLink,
  IconUnlock,
  Modal,
} from 'ui'
import Link from 'next/link'
import { useStore } from 'hooks'
import { useParams } from 'common/hooks'
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
            header="Confirm"
            buttonLabel="Confirm"
            size="medium"
            onSelectCancel={() => setIsOpen(false)}
            onSelectConfirm={handleDismissWarning}
            children={
              <Modal.Content>
                <div className="flex gap-4 my-6">
                  <div>
                    <div className="w-16 h-16 bg-scale-300 flex flex-col justify-center text-center items-center rounded-full">
                      <IconUnlock strokeWidth={2} size={24} />
                    </div>
                  </div>
                  <div className="text-sm text-scale-1100 grid gap-4">
                    <div className="grid gap-1">
                      <p>
                        Row Level Security will be turned <u>off</u> for this table.
                      </p>

                      <Alert
                        variant="warning"
                        className="!px-4 !py-3 mt-3"
                        title=" You are making this table public"
                      >
                        <p>
                          Anyone with the anon key can modify or delete data. <br />
                          We recommend using RLS policies to control access to your data.
                        </p>
                      </Alert>
                    </div>

                    <div className="mt-3">
                      <p className="mt-2">
                        <Link href="https://supabase.com/docs/guides/auth/row-level-security">
                          <a target="_blank">
                            <Button type="default" icon={<IconBookOpen strokeWidth={1.5} />}>
                              RLS Documentation
                            </Button>
                          </a>
                        </Link>
                      </p>
                    </div>
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

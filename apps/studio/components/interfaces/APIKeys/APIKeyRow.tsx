import { IS_PLATFORM } from 'common'
import { motion } from 'framer-motion'
import { MoreVertical } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

import { APIKeyDeleteDialog } from './APIKeyDeleteDialog'
import { ApiKeyPill } from './ApiKeyPill'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import type { APIKeysData } from '@/data/api-keys/api-keys-query'

export const APIKeyRow = ({
  apiKey,
  isDeleting,
  isDeleteModalOpen,
  onDelete,
  setKeyToDelete,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
  isDeleting: boolean
  isDeleteModalOpen: boolean
  onDelete: () => void
  setKeyToDelete: (id: string | null) => void
}) => {
  const MotionTableRow = motion.create(TableRow)

  return (
    <>
      <MotionTableRow
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 50,
          mass: 1,
        }}
      >
        <TableCell className="py-2 w-56">
          <div className="flex flex-col">
            <span className="font-medium">{apiKey.name}</span>
            <div className="text-sm text-foreground-lighter">
              {apiKey.description || <span className="text-foreground-muted">No description</span>}
            </div>
          </div>
        </TableCell>

        <TableCell className="py-2">
          <div className="flex flex-row gap-2">
            <ApiKeyPill apiKey={apiKey} />
          </div>
        </TableCell>

        {IS_PLATFORM && (
          <TableCell className="py-2">
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger className="px-1 focus-visible:outline-hidden" asChild>
                  <Button
                    variant="text"
                    size="tiny"
                    icon={
                      <MoreVertical
                        size="14"
                        className="text-foreground-light hover:text-foreground"
                      />
                    }
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-w-40" align="end">
                  <APIKeyDeleteDialog apiKey={apiKey} setKeyToDelete={setKeyToDelete} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        )}
      </MotionTableRow>

      <TextConfirmModal
        visible={isDeleteModalOpen}
        onCancel={() => setKeyToDelete(null)}
        onConfirm={onDelete}
        title={`Delete ${apiKey.type} API key: ${apiKey.name}`}
        confirmString={apiKey.name}
        confirmLabel="Yes, irreversibly delete this API key"
        confirmPlaceholder="Type the name of the API key to confirm"
        loading={isDeleting}
        variant="destructive"
        alert={{
          title: 'This cannot be undone',
          description:
            'Make sure all applications and services using it have been updated before deletion. Deletion will cause them to receive HTTP 401 Unauthorized status codes on all Supabase APIs.',
        }}
      />
    </>
  )
}

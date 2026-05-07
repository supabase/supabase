import { motion } from 'framer-motion'
import { MoreVertical } from 'lucide-react'

import { useFlag } from 'common'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import type { APIKeysData } from 'data/api-keys/api-keys-query'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import { ShimmeringLoader, TimestampInfo } from 'ui-patterns'
import { APIKeyDeleteDialog } from './APIKeyDeleteDialog'
import { ApiKeyPill } from './ApiKeyPill'

export const APIKeyRow = ({
  apiKey,
  lastSeen,
  isDeleting,
  isDeleteModalOpen,
  isLoadingLastSeen = false,
  showLastSeen = true,
  onDelete,
  setKeyToDelete,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
  lastSeen?: { timestamp: number; relative: string }
  showLastSeen?: boolean
  isDeleting: boolean
  isDeleteModalOpen: boolean
  isLoadingLastSeen?: boolean
  onDelete: () => void
  setKeyToDelete: (id: string | null) => void
}) => {
  const MotionTableRow = motion.create(TableRow)
  const showApiKeysLastUsed = useFlag('showApiKeysLastUsed')

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

        {showLastSeen && showApiKeysLastUsed && (
          <TableCell className="py-2 min-w-0 whitespace-nowrap hidden lg:table-cell">
            <div className="truncate" title={lastSeen?.timestamp.toString() || 'Never used'}>
              {isLoadingLastSeen ? (
                <ShimmeringLoader />
              ) : lastSeen?.timestamp ? (
                <TimestampInfo
                  className="text-sm"
                  utcTimestamp={lastSeen?.timestamp}
                  label={lastSeen.relative}
                />
              ) : (
                <span className="text-foreground-lighter">Never used</span>
              )}
            </div>
          </TableCell>
        )}

        <TableCell className="py-2">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="px-1 focus-visible:outline-none" asChild>
                <Button
                  type="text"
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
          description: lastSeen
            ? `This API key was used ${lastSeen.timestamp}. Make sure all backend components using it have been updated. Deletion will cause them to receive HTTP 401 Unauthorized status codes on all Supabase APIs.`
            : `This API key has not been used in the past 24 hours. Make sure you've updated all backend components using it before deletion.`,
        }}
      />
    </>
  )
}

import { IS_PLATFORM } from 'common'
import { MoreHorizontal, PlugZap, TrashIcon } from 'lucide-react'
import { cloneElement, useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { LOG_DRAIN_TYPES, LogDrainType } from './LogDrains.constants'
import { LogDrainsCard } from './LogDrainsCard'
import { useEnabledLogDrainTypes } from './useEnabledLogDrainTypes'
import { VoteLink } from './VoteLink'
import AlertError from '@/components/ui/AlertError'
import { LogDrainData } from '@/data/log-drains/log-drains-query'
import type { ResponseError } from '@/types'

export function LogDrainsList({
  logDrains,
  isLoading,
  isError,
  error,
  isDeleting,
  onNewDrainClick,
  onDeleteDrain,
  onTestDrain,
}: {
  logDrains: LogDrainData[] | undefined
  isLoading: boolean
  isError: boolean
  error: ResponseError | null
  isDeleting?: boolean
  onNewDrainClick: (src: LogDrainType) => void
  onDeleteDrain: (drain: LogDrainData) => void
  onTestDrain?: (drain: LogDrainData) => void
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLogDrain, setSelectedLogDrain] = useState<LogDrainData | null>(null)

  const enabledDrainTypes = useEnabledLogDrainTypes()
  const hasLogDrains = !!logDrains?.length

  const wasDeleting = useRef(false)
  useEffect(() => {
    if (wasDeleting.current && !isDeleting) {
      setIsDeleteModalOpen(false)
      setSelectedLogDrain(null)
    }
    wasDeleting.current = !!isDeleting
  }, [isDeleting])

  if (isLoading) {
    return (
      <div>
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (isError) {
    return <AlertError subject="Failed to load log drains" error={error}></AlertError>
  }

  if (!hasLogDrains) {
    return (
      <>
        <div className="grid lg:grid-cols-3 gap-4">
          {enabledDrainTypes.map((src) => (
            <LogDrainsCard
              key={src.value}
              title={src.name}
              description={src.description}
              icon={src.icon}
              rightLabel={IS_PLATFORM ? 'Additional $60' : undefined}
              onClick={() => {
                onNewDrainClick(src.value)
              }}
            />
          ))}
        </div>
        <VoteLink />
      </>
    )
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-[200px]">Name</TableHead>
              <TableHead className="w-96">Description</TableHead>
              <TableHead className="w-48">Destination</TableHead>
              <TableHead className="text-right">
                <div className="sr-only">Actions</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logDrains
              ?.slice()
              .sort((a, b) => b.id - a.id)
              .map((drain) => (
                <TableRow key={drain.id}>
                  <TableCell className="font-medium truncate max-w-72" title={drain.name}>
                    {drain.name}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'truncate max-w-96',
                      drain.description ? 'text-foreground-light' : 'text-foreground-muted'
                    )}
                    title={drain.description}
                  >
                    {drain.description || '-'}
                  </TableCell>
                  <TableCell className="text-foreground-light">
                    <div className="flex items-center gap-2">
                      {LOG_DRAIN_TYPES.find((t) => t.value === drain.type)?.icon && (
                        <span className="text-foreground-light">
                          {cloneElement(LOG_DRAIN_TYPES.find((t) => t.value === drain.type)!.icon, {
                            height: 16,
                            width: 16,
                          })}
                        </span>
                      )}
                      <span className="truncate max-w-40">
                        {LOG_DRAIN_TYPES.find((t) => t.value === drain.type)?.name ?? drain.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="text"
                          className="px-1 opacity-50 hover:opacity-100 bg-transparent! shrink-0"
                          icon={<MoreHorizontal />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="max-w-[160px]" align="end">
                        {onTestDrain && (
                          <DropdownMenuItem onClick={() => onTestDrain(drain)}>
                            <PlugZap className="h-4 w-4 mr-2" />
                            Test connection
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLogDrain(drain)
                            setIsDeleteModalOpen(true)
                          }}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>

          <ConfirmationModal
            confirmLabel="Delete"
            variant="destructive"
            title="Delete Log Drain"
            visible={isDeleteModalOpen}
            loading={isDeleting}
            onConfirm={() => {
              if (selectedLogDrain) {
                onDeleteDrain(selectedLogDrain)
              }
            }}
            onCancel={() => setIsDeleteModalOpen(false)}
          >
            <div className="text-foreground-light text-sm">
              <p>
                Are you sure you want to delete{' '}
                <span className="text-foreground">{selectedLogDrain?.name}</span>?
              </p>
              <p>This action cannot be undone.</p>
            </div>
          </ConfirmationModal>
        </Table>
      </Card>
    </>
  )
}

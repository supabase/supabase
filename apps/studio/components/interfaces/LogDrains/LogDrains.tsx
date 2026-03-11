import { IS_PLATFORM, useFlag, useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useDeleteLogDrainMutation } from 'data/log-drains/delete-log-drain-mutation'
import { LogDrainData, useLogDrainsQuery } from 'data/log-drains/log-drains-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useTrack } from 'lib/telemetry/track'
import { MoreHorizontal, Pencil, TrashIcon } from 'lucide-react'
import { cloneElement, useState } from 'react'
import { toast } from 'sonner'
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
import { LogDrainsEmpty } from './LogDrainsEmpty'
import { VoteLink } from './VoteLink'

export function LogDrains({
  onNewDrainClick,
  onUpdateDrainClick,
}: {
  onNewDrainClick: (src: LogDrainType) => void
  onUpdateDrainClick: (drain: LogDrainData) => void
}) {
  const { hasAccess: hasAccessToLogDrains, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('log_drains')
  const track = useTrack()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLogDrain, setSelectedLogDrain] = useState<LogDrainData | null>(null)
  const { ref } = useParams()
  const {
    data: logDrains,
    isPending: isLoading,
    refetch,
    error,
    isError,
  } = useLogDrainsQuery(
    { ref },
    {
      enabled: hasAccessToLogDrains,
    }
  )
  const sentryEnabled = useFlag('SentryLogDrain')
  const s3Enabled = useFlag('S3logdrain')
  const axiomEnabled = useFlag('axiomLogDrain')
  const otlpEnabled = useFlag('otlpLogDrain')
  const last9Enabled = useFlag('Last9LogDrain')
  const hasLogDrains = !!logDrains?.length

  const { mutate: deleteLogDrain } = useDeleteLogDrainMutation({
    onSuccess: () => {
      setIsDeleteModalOpen(false)
      setSelectedLogDrain(null)
    },
    onError: () => {
      setIsDeleteModalOpen(false)
      setSelectedLogDrain(null)
      toast.error('Failed to delete log drain')
    },
  })

  if (isLoading || isLoadingEntitlement) {
    return (
      <div>
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!isLoadingEntitlement && !hasAccessToLogDrains) {
    return <LogDrainsEmpty />
  }

  if (isError) {
    return <AlertError subject="Failed to load log drains" error={error}></AlertError>
  }

  if (!isLoading && !hasLogDrains) {
    return (
      <>
        <div className="grid lg:grid-cols-3 gap-4">
          {LOG_DRAIN_TYPES.filter((t) => {
            if (t.value === 'sentry') return sentryEnabled
            if (t.value === 's3') return s3Enabled
            if (t.value === 'axiom') return axiomEnabled
            if (t.value === 'otlp') return otlpEnabled
            if (t.value === 'last9') return last9Enabled
            return true
          }).map((src) => (
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
                          type="text"
                          className="px-1 opacity-50 hover:opacity-100 !bg-transparent flex-shrink-0"
                          icon={<MoreHorizontal />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="max-w-[140px]" align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            onUpdateDrainClick(drain)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Update
                        </DropdownMenuItem>
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
            onConfirm={() => {
              if (selectedLogDrain && ref) {
                deleteLogDrain({ token: selectedLogDrain.token, projectRef: ref })
                track('log_drain_confirm_button_submitted', {
                  destination: selectedLogDrain.type,
                })
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

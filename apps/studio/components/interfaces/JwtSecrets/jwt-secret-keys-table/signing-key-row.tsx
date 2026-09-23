import { components } from 'api-types'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import {
  CircleArrowDown,
  CircleArrowUp,
  Eye,
  Key,
  Minus,
  MoreVertical,
  ShieldOff,
  Timer,
  Trash2,
} from 'lucide-react'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AlgorithmHoverCard } from '../algorithm-hover-card'
import { statusColors, statusLabels } from '../jwt.constants'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { JWTSigningKey } from '@/data/jwt-signing-keys/jwt-signing-keys-query'

interface SigningKeyRowProps {
  signingKey: components['schemas']['SigningKeyResponse_Output']
  setSelectedKey: (key?: JWTSigningKey) => void
  setShownDialog: (dialog?: 'key-details' | 'revoke' | 'delete') => void
  handlePreviouslyUsedKey: (keyId: string) => void
  handleStandbyKey: (keyId: string) => void
  legacyKey?: JWTSigningKey | null
  standbyKey?: JWTSigningKey | null
  isLoading?: boolean
  lastUsedAt?: number
  isLoadingLastUsed?: boolean
  isLastUsedError?: boolean
  isLastUsedVisible?: boolean
}

const MotionTableRow = motion.create(TableRow)

const hasRotationTimestamp = (status: JWTSigningKey['status']) =>
  status === 'previously_used' || status === 'revoked'

const LastUsedCell = ({
  lastUsedAt,
  isLoading,
  isError,
  isLastUsedSupported,
}: {
  lastUsedAt?: number
  isLoading: boolean
  isError: boolean
  isLastUsedSupported: boolean
}) => {
  const className =
    'text-right py-2 text-sm text-foreground-light whitespace-nowrap data-[invisible=true]:invisible'

  if (!isLastUsedSupported)
    return (
      <TableCell>
        <Minus size={14} className="text-foreground-lighter ml-auto" />
      </TableCell>
    )

  if (isLoading) {
    return (
      <TableCell aria-label="Loading last used timestamp" className={className}>
        <ShimmeringLoader className="w-14 ml-auto" />
      </TableCell>
    )
  }

  if (isError) return <TableCell className={className}>Unable to load</TableCell>
  if (lastUsedAt === undefined) {
    return (
      <TableCell className={cn(className, 'text-foreground-lighter')}>No requests in 24h</TableCell>
    )
  }

  return (
    <TableCell className={className}>
      <TimestampInfo
        className="text-sm"
        utcTimestamp={new Date(lastUsedAt).toISOString()}
        label={dayjs(lastUsedAt).fromNow()}
      />
    </TableCell>
  )
}

export const SigningKeyRow = ({
  signingKey,
  setSelectedKey,
  setShownDialog,
  handlePreviouslyUsedKey,
  handleStandbyKey,
  legacyKey,
  standbyKey,
  isLoading = false,
  lastUsedAt,
  isLoadingLastUsed = false,
  isLastUsedError = false,
  isLastUsedVisible = false,
}: SigningKeyRowProps) => (
  <MotionTableRow
    key={signingKey.id}
    layout
    initial={{ opacity: 0, height: 0 }}
    animate={{
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.2 },
    }}
    exit={{ opacity: 0, height: 0 }}
    className={cn(
      signingKey.status !== 'in_use' ? 'border-b border-dashed border-border' : 'border-b'
    )}
  >
    <TableCell className="w-[150px] pr-0 py-2">
      <div className="flex -space-x-px items-center">
        <Badge
          className={cn(
            statusColors[signingKey.status],
            'rounded-r-none',
            'gap-2 w-full h-6',
            'uppercase font-mono',
            'border-r-0'
          )}
        >
          {signingKey.status === 'standby' ? (
            <Timer className="shrink-0" size={14} />
          ) : (
            <Key className="shrink-0" size={14} />
          )}
          <span className="truncate text-xs">{statusLabels[signingKey.status]}</span>
        </Badge>
      </div>
    </TableCell>
    <TableCell className="font-mono truncate w-[315px] pl-0 py-2">
      <div className="min-w-0 flex">
        <Badge
          className={cn(
            'bg-default-200/100 border-foreground-muted',
            'rounded-l-none',
            'gap-2 py-2 h-6 min-w-0 overflow-hidden flex items-center flex-1'
          )}
        >
          <span className="truncate flex-1 text-xs" title={signingKey.id}>
            {signingKey.id}
          </span>
        </Badge>
      </div>
    </TableCell>
    <TableCell className="truncate py-2">
      <AlgorithmHoverCard
        algorithm={signingKey.algorithm}
        legacy={signingKey.id === legacyKey?.id}
      />
    </TableCell>
    {isLastUsedVisible && (
      <LastUsedCell
        lastUsedAt={lastUsedAt}
        isLoading={isLoadingLastUsed}
        isError={isLastUsedError}
        isLastUsedSupported={signingKey.id !== legacyKey?.id}
      />
    )}
    {!isLastUsedVisible && !hasRotationTimestamp(signingKey.status) && <TableCell />}
    {hasRotationTimestamp(signingKey.status) && (
      <TableCell className="max-w-[100px] text-right py-2 text-sm text-foreground-light whitespace-nowrap hidden lg:table-cell">
        <TimestampInfo
          className="text-sm"
          utcTimestamp={signingKey.updated_at}
          label={dayjs(signingKey.updated_at).fromNow()}
        />
      </TableCell>
    )}
    <TableCell className="text-right py-2">
      {(signingKey.status !== 'in_use' || signingKey.algorithm !== 'HS256') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="More options"
              variant="text"
              className="px-1.5"
              loading={isLoading}
              icon={<MoreVertical className="size-4" />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {signingKey.algorithm !== 'HS256' && (
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedKey(signingKey)
                  setShownDialog('key-details')
                }}
              >
                <Eye className="mr-2 size-4" />
                View key details
              </DropdownMenuItem>
            )}
            {signingKey.status === 'standby' && (
              <>
                <DropdownMenuItem
                  onSelect={() => handlePreviouslyUsedKey(signingKey.id)}
                  className="text-destructive"
                >
                  <CircleArrowDown className="mr-2 size-4" />
                  Move to previously used
                </DropdownMenuItem>
              </>
            )}
            {signingKey.status === 'previously_used' && (
              <>
                <DropdownMenuItemTooltip
                  disabled={!!standbyKey}
                  onSelect={() => handleStandbyKey(signingKey.id)}
                  tooltip={{
                    content: {
                      side: 'left',
                      text: !!standbyKey
                        ? 'You may only have one standby key at a time'
                        : undefined,
                    },
                  }}
                >
                  <CircleArrowUp className="mr-2 size-4" />
                  Move to standby key
                </DropdownMenuItemTooltip>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedKey(signingKey)
                    setShownDialog('revoke')
                  }}
                  className="text-destructive"
                >
                  <ShieldOff className="mr-2 size-4" />
                  Revoke key
                </DropdownMenuItem>
              </>
            )}
            {signingKey.status === 'revoked' && (
              <>
                <DropdownMenuItemTooltip
                  disabled={!!standbyKey}
                  onSelect={() => handleStandbyKey(signingKey.id)}
                  tooltip={{
                    content: {
                      side: 'left',
                      text: !!standbyKey
                        ? 'You may only have one standby key at a time'
                        : undefined,
                    },
                  }}
                >
                  <CircleArrowUp className="mr-2 size-4" />
                  Move to standby key
                </DropdownMenuItemTooltip>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedKey(signingKey)
                    setShownDialog('delete')
                  }}
                  className="text-destructive"
                  disabled={legacyKey?.id === signingKey.id}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete permanently
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </TableCell>
  </MotionTableRow>
)

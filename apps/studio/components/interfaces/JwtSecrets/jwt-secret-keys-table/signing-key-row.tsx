import { components } from 'api-types'
import dayjs from 'dayjs'
import {
  CircleArrowDownIcon,
  CircleArrowUpIcon,
  EyeIcon,
  MinusIcon,
  MoreVerticalIcon,
  ShieldOffIcon,
  Trash2Icon,
} from 'lucide-react'
import { motion } from 'motion/react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AlgorithmHoverCard } from '../algorithm-hover-card'
import { statusLabels } from '../jwt.constants'
import { CopyableKey } from './copyable-key'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
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
    'text-right text-sm text-foreground-light whitespace-nowrap data-[invisible=true]:invisible'

  if (!isLastUsedSupported)
    return (
      <TableCell>
        <MinusIcon size={14} className="text-foreground-lighter ml-auto" />
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
    <TableCell className="whitespace-nowrap">
      <p className={cn(signingKey.status !== 'in_use' && 'text-foreground-lighter')}>
        {statusLabels[signingKey.status]}
      </p>
      <CopyableKey keyId={signingKey.id} />
    </TableCell>

    <TableCell>
      <AlgorithmHoverCard algorithm={signingKey.algorithm} />
    </TableCell>

    <TableCell className="text-right text-sm text-foreground-light whitespace-nowrap hidden xl:table-cell">
      <TimestampInfo
        className="text-sm"
        utcTimestamp={signingKey.created_at}
        label={dayjs(signingKey.created_at).fromNow()}
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
      <TableCell className="max-w-[100px] text-right text-sm text-foreground-light whitespace-nowrap hidden xl:table-cell">
        <TimestampInfo
          className="text-sm"
          utcTimestamp={signingKey.updated_at}
          label={dayjs(signingKey.updated_at).fromNow()}
        />
      </TableCell>
    )}

    <TableCell className="text-right">
      {(signingKey.status !== 'in_use' || signingKey.algorithm !== 'HS256') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ButtonTooltip
              variant="default"
              aria-label="More options"
              className="px-1.5"
              loading={isLoading}
              icon={<MoreVerticalIcon className="size-4" />}
              tooltip={{ content: { side: 'bottom', text: 'More options' } }}
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            {signingKey.algorithm !== 'HS256' && (
              <DropdownMenuItem
                className="gap-x-2"
                onSelect={() => {
                  setSelectedKey(signingKey)
                  setShownDialog('key-details')
                }}
              >
                <EyeIcon size={14} />
                View key details
              </DropdownMenuItem>
            )}

            {signingKey.status !== 'in_use' && signingKey.algorithm !== 'HS256' && (
              <DropdownMenuSeparator />
            )}

            {signingKey.status === 'standby' && (
              <DropdownMenuItem
                className="gap-x-2"
                onSelect={() => handlePreviouslyUsedKey(signingKey.id)}
              >
                <CircleArrowDownIcon size={14} />
                Move to previously used
              </DropdownMenuItem>
            )}
            {signingKey.status === 'previously_used' && (
              <>
                <DropdownMenuItemTooltip
                  disabled={!!standbyKey}
                  className="gap-x-2"
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
                  <CircleArrowUpIcon size={14} />
                  Move to standby key
                </DropdownMenuItemTooltip>

                <DropdownMenuItem
                  className="gap-x-2"
                  onSelect={() => {
                    setSelectedKey(signingKey)
                    setShownDialog('revoke')
                  }}
                >
                  <ShieldOffIcon size={14} />
                  Revoke key
                </DropdownMenuItem>
              </>
            )}
            {signingKey.status === 'revoked' && (
              <>
                <DropdownMenuItemTooltip
                  className="gap-x-2"
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
                  <CircleArrowUpIcon size={14} />
                  Move to standby key
                </DropdownMenuItemTooltip>

                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedKey(signingKey)
                    setShownDialog('delete')
                  }}
                  className="gap-x-2"
                  disabled={legacyKey?.id === signingKey.id}
                >
                  <Trash2Icon size={14} />
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

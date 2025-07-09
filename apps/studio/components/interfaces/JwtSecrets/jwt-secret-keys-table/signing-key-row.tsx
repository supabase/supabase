import { motion } from 'framer-motion'
import {
  CircleArrowDown,
  CircleArrowUp,
  Trash2,
  Eye,
  Key,
  MoreVertical,
  ShieldOff,
  Timer,
} from 'lucide-react'

import { components } from 'api-types'
import { JWTSigningKey } from 'data/jwt-signing-keys/jwt-signing-keys-query'
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
import { AlgorithmHoverCard } from '../algorithm-hover-card'
import { statusColors, statusLabels } from '../jwt.constants'

interface SigningKeyRowProps {
  signingKey: components['schemas']['SigningKeyResponse']
  setSelectedKey: (key: JWTSigningKey | null) => void
  setShownDialog: (dialog: 'key-details' | 'revoke' | 'delete' | null) => void
  handlePreviouslyUsedKey: (keyId: string) => void
  handleStandbyKey: (keyId: string) => void
  legacyKey?: JWTSigningKey | null
  standbyKey?: JWTSigningKey | null
}

const MotionTableRow = motion(TableRow)

export const SigningKeyRow = ({
  signingKey,
  setSelectedKey,
  setShownDialog,
  handlePreviouslyUsedKey,
  handleStandbyKey,
  legacyKey,
  standbyKey,
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
            <Timer className="size-4" />
          ) : (
            <Key className="size-4" />
          )}
          {statusLabels[signingKey.status]}
        </Badge>
      </div>
    </TableCell>
    <TableCell className="font-mono truncate max-w-[100px] pl-0 py-2">
      <div className="">
        <Badge
          className={cn(
            'bg-opacity-100 bg-200 border-foreground-muted',
            'rounded-l-none',
            'gap-2 py-2 h-6'
          )}
        >
          {signingKey.id}
        </Badge>
      </div>
    </TableCell>
    <TableCell className="truncate max-w-[100px] py-2">
      <AlgorithmHoverCard
        algorithm={signingKey.algorithm}
        legacy={signingKey.id === legacyKey?.id}
      />
    </TableCell>
    <TableCell className="text-right py-2">
      {(signingKey.status !== 'in_use' || signingKey.algorithm !== 'HS256') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" className="px-2" icon={<MoreVertical className="size-4" />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
                <DropdownMenuItem
                  onSelect={() => {
                    handleStandbyKey(signingKey.id)
                  }}
                  disabled={!!standbyKey}
                >
                  <CircleArrowUp className="mr-2 size-4" />
                  Move to standby key
                </DropdownMenuItem>
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
                <DropdownMenuItem
                  onSelect={() => {
                    handleStandbyKey(signingKey.id)
                  }}
                  disabled={!!standbyKey}
                >
                  <CircleArrowUp className="mr-2 size-4" />
                  Move to standby key
                </DropdownMenuItem>
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

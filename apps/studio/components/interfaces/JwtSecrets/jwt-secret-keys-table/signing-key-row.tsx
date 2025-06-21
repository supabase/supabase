import { motion } from 'framer-motion'
import { CircleArrowDown, Eye, Key, MoreVertical, ShieldOff, Timer } from 'lucide-react'

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
  setShownDialog: (
    dialog:
      | 'legacy'
      | 'create'
      | 'rotate'
      | 'confirm-rotate'
      | 'key-details'
      | 'revoke'
      | 'delete'
      | null
  ) => void
  handlePreviouslyUsedKey: (keyId: string) => void
  legacyKey?: components['schemas']['SigningKeyResponse'] | null
}

const MotionTableRow = motion(TableRow)

export const SigningKeyRow = ({
  signingKey,
  setSelectedKey,
  setShownDialog,
  handlePreviouslyUsedKey,
  legacyKey,
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
          {signingKey.status === 'standby' ? <Timer size={13} /> : <Key size={13} />}
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
          <span className="truncate">{signingKey.id}</span>
          <button
            onClick={() => {
              setSelectedKey(signingKey)
              setShownDialog('key-details')
            }}
          >
            <Eye size={13} strokeWidth={1.5} />
          </button>
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="text" className="px-2" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setSelectedKey(signingKey)
              setShownDialog('key-details')
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            View key details
          </DropdownMenuItem>
          {signingKey.status === 'standby' && (
            <>
              <DropdownMenuItem
                onSelect={() => handlePreviouslyUsedKey(signingKey.id)}
                className="text-destructive"
              >
                <CircleArrowDown className="mr-2 h-4 w-4" />
                Move to previously used
              </DropdownMenuItem>
            </>
          )}
          {signingKey.status === 'previously_used' && (
            <DropdownMenuItem
              onSelect={() => {
                setSelectedKey(signingKey)
                setShownDialog('revoke')
              }}
              className="text-destructive"
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Revoke key
              <span className="text-xs text-foreground-light ml-2">(after 30 days)</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </MotionTableRow>
)

import { APIKeysData } from 'data/api-keys/api-keys-query'
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

export const APIKeyRow = ({
  apiKey,
  lastSeen,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
  lastSeen?: { timestamp: string }
}) => {
  const MotionTableRow = motion.create(TableRow)

  return (
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
      <TableCell className="py-2">
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

      <TableCell className="py-2 min-w-0 whitespace-nowrap hidden lg:table-cell">
        <div className="truncate" title={lastSeen?.timestamp || 'Never used'}>
          {lastSeen?.timestamp ?? <span className="text-foreground-lighter">Never used</span>}
        </div>
      </TableCell>

      <TableCell className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger className="px-1 focus-visible:outline-none" asChild>
            <Button
              type="text"
              size="tiny"
              icon={
                <MoreVertical size="14" className="text-foreground-light hover:text-foreground" />
              }
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40" align="end">
            <APIKeyDeleteDialog apiKey={apiKey} lastSeen={lastSeen} />
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </MotionTableRow>
  )
}

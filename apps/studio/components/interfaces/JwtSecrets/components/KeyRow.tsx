import { motion } from 'framer-motion'
import { Eye, Key, MoreVertical, Timer, Trash2, Edit } from 'lucide-react'
import { Badge, Button, cn } from 'ui'
import { TableCell, TableRow } from 'ui/src/components/shadcn/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui/src/components/shadcn/ui/dropdown-menu'
import { SigningKey } from 'state/jwt-secrets'
import { statusColors, statusLabels } from '../constants'
import dayjs from 'dayjs'
import { AlgorithmHoverCard } from '../AlgorithmHoverCard'

interface KeyRowProps {
  key: SigningKey
  onViewDetails: (key: SigningKey) => void
  onEditStandby?: (key: SigningKey) => void
  onDeleteStandby?: (keyId: string) => void
  onRevoke?: (key: SigningKey) => void
}

const MotionTableRow = motion(TableRow)

export const KeyRow = ({
  key,
  onViewDetails,
  onEditStandby,
  onDeleteStandby,
  onRevoke,
}: KeyRowProps) => {
  return (
    <MotionTableRow
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.2 },
      }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(key.status !== 'in_use' ? 'border-b border-dashed border-border' : 'border-b')}
    >
      <TableCell className="w-[150px] pr-0 py-2">
        <div className="flex -space-x-px items-center">
          <Badge
            className={cn(
              statusColors[key.status],
              'rounded-r-none',
              'gap-2 w-full h-6',
              'uppercase font-mono',
              'border-r-0'
            )}
          >
            {key.status === 'standby' ? <Timer size={13} /> : <Key size={13} />}
            {statusLabels[key.status]}
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
            <span className="truncate">{key.id}</span>
            <button onClick={() => onViewDetails(key)}>
              <Eye size={13} strokeWidth={1.5} />
            </button>
          </Badge>
        </div>
      </TableCell>
      <TableCell className="truncate max-w-[150px] font-mono text-xs py-2">
        {dayjs(key.updated_at).format('YYYY-MM-DD HH:mm:ss')}
      </TableCell>
      <TableCell className="truncate max-w-[100px] py-2">
        <AlgorithmHoverCard algorithm={key.algorithm} />
      </TableCell>
      <TableCell className="text-right py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" className="px-2" icon={<MoreVertical />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onViewDetails(key)}>
              <Eye className="mr-2 h-4 w-4" />
              View key details
            </DropdownMenuItem>
            {key.status === 'standby' && onEditStandby && onDeleteStandby && (
              <>
                <DropdownMenuItem onSelect={() => onEditStandby(key)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit standby key
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDeleteStandby(key.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete standby key
                </DropdownMenuItem>
              </>
            )}
            {key.status === 'previously_used' && onRevoke && (
              <DropdownMenuItem onSelect={() => onRevoke(key)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke key
                <span className="text-xs text-foreground-light ml-2">(after 30 days)</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </MotionTableRow>
  )
}

import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { formatDateTime } from './utils'
import { RotateCcw, MoreVertical } from 'lucide-react'

export type DeployListItemProps = {
  deployment: EdgeFunctionDeployment
  isRestoring: boolean
  onRestore: (deployment: EdgeFunctionDeployment) => void
}

export const DeployListItem = ({ deployment, isRestoring, onRestore }: DeployListItemProps) => {
  return (
    <TableRow className={cn('border-b last:border-b-0')}>
      <TableCell>{formatDateTime(deployment.created_at)}</TableCell>
      <TableCell>
        {deployment.status === 'ACTIVE' ? (
          <Badge variant="success" className="text-xs">
            Active
          </Badge>
        ) : (
          <Badge className="text-xs">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="truncate">{deployment.commit_message ?? ''}</TableCell>
      <TableCell>
        {deployment.commit_hash ? <span className="font-mono">#{deployment.commit_hash}</span> : ''}
      </TableCell>
      <TableCell>
        {typeof deployment.size_kb === 'number' ? `${deployment.size_kb.toFixed(1)} KB` : ''}
      </TableCell>
      <TableCell className="text-right">
        {deployment.status !== 'ACTIVE' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Actions for version ${deployment.version}`}
                type="default"
                className="px-1"
                icon={<MoreVertical />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left" className="w-40">
              <DropdownMenuItem
                className="space-x-2"
                disabled={isRestoring}
                onClick={() => !isRestoring && onRestore(deployment)}
              >
                <RotateCcw size={14} />
                <p>Restore deployment</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  )
}

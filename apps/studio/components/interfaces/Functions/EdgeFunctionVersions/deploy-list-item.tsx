import { Badge, Button, cn, TableRow, TableCell } from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { formatDateTime } from './utils'

export type DeployListItemProps = {
  deployment: EdgeFunctionDeployment
  isRestoring: boolean
  onRestore: (deployment: EdgeFunctionDeployment) => void
}

export const DeployListItem = ({ deployment, isRestoring, onRestore }: DeployListItemProps) => {
  return (
    <TableRow className={cn('')}>
      <TableCell className="py-3 pr-2 align-top">{formatDateTime(deployment.created_at)}</TableCell>
      <TableCell className="py-3 pr-2 align-top">
        {deployment.status === 'ACTIVE' ? (
          <Badge variant="default" className="text-xs">
            Active
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Inactive</span>
        )}
      </TableCell>
      <TableCell className="py-3 pr-2 align-top text-foreground-light">
        {deployment.commit_message ?? ''}
      </TableCell>
      <TableCell className="py-3 pr-2 align-top">
        {deployment.commit_hash ? (
          <span className="font-mono text-foreground-light">#{deployment.commit_hash}</span>
        ) : (
          ''
        )}
      </TableCell>
      <TableCell className="py-3 pr-2 align-top">
        {typeof deployment.size_kb === 'number' ? `${deployment.size_kb.toFixed(1)} KB` : ''}
      </TableCell>
      <TableCell className="py-3 pl-2 align-top text-right">
        {deployment.status !== 'ACTIVE' && (
          <Button
            type="default"
            size="tiny"
            disabled={isRestoring}
            aria-label={`Restore version ${deployment.version}`}
            onClick={() => onRestore(deployment)}
          >
            Restore
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

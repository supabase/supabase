import { Eye } from 'lucide-react'

import { Button, Badge, cn } from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { formatDateTime } from './utils'

export type VersionListItemProps = {
  deployment: EdgeFunctionDeployment
  isSelected: boolean
  isRestoring: boolean
  onPreview: (deployment: EdgeFunctionDeployment) => void
  onRestore?: (deployment: EdgeFunctionDeployment) => void
}

export const VersionListItem = ({
  deployment,
  isSelected,
  isRestoring,
  onPreview,
  onRestore,
}: VersionListItemProps) => {
  return (
    <div
      onClick={() => onPreview(deployment)}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-colors',
        isSelected ? 'bg-accent/50 border-primary' : 'hover:bg-accent/30 border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-x-3">
            <div className="text-foreground font-medium">
              {formatDateTime(deployment.created_at)}
            </div>
            {deployment.status === 'ACTIVE' && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          {deployment.commit_message && (
            <div className="text-sm text-foreground-light">{deployment.commit_message}</div>
          )}
          <div className="flex items-center gap-x-4 text-xs text-muted-foreground">
            {deployment.commit_hash && (
              <span className="font-mono text-foreground-light">#{deployment.commit_hash}</span>
            )}
            {typeof deployment.size_kb === 'number' && (
              <span className="text-foreground-light">{deployment.size_kb.toFixed(1)} KB</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            type="default"
            size="tiny"
            aria-label="Preview code"
            onClick={(e) => {
              e.stopPropagation()
              onPreview(deployment)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {deployment.status !== 'ACTIVE' && (
            <Button
              type="default"
              size="tiny"
              disabled={isRestoring}
              aria-label={`Restore version ${deployment.version}`}
              onClick={(e) => {
                e.stopPropagation()
                onRestore?.(deployment)
              }}
            >
              Restore
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogContent,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogTitle,
  Badge,
  Button,
  AlertDialogTrigger,
} from 'ui'
import { CheckCircle2, GitCommit, Eye, RotateCcw } from 'lucide-react'

export type Version = {
  id: string
  timestamp: string
  commitMessage?: string
  commitHash?: string
  isActive: boolean
  content: string
  size: string
}

type ListItemProps = {
  version: Version
  isSelected: boolean
  isRestoring: boolean
  onSelect: (version: Version) => void
  onRestore: (version: Version) => void
  formatTimestamp: (timestamp: string) => string
}

export const ListItem = ({
  version,
  isSelected,
  isRestoring,
  onSelect,
  onRestore,
  formatTimestamp,
}: ListItemProps) => {
  return (
    <div
      key={version.id}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${
        isSelected ? 'border-primary bg-accent/30' : 'border-border'
      }`}
      onClick={() => onSelect(version)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {formatTimestamp(version.timestamp)}
            </span>
            {version.isActive && (
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>

          {version.commitMessage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitCommit className="h-3 w-3" />
              <span>{version.commitMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {version.commitHash && <span className="font-mono">#{version.commitHash}</span>}
            <span>{version.size}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="default"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(version)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>

          {!version.isActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="default" icon={<RotateCcw />} onClick={(e) => e.stopPropagation()}>
                  Restore
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restore Version</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to restore this version? This will replace the currently
                    active version and cannot be undone.
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <div className="text-sm font-medium">Version Details:</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatTimestamp(version.timestamp)}
                      </div>
                      {version.commitMessage && (
                        <div className="text-sm text-muted-foreground">{version.commitMessage}</div>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onRestore(version)}
                    disabled={isRestoring}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isRestoring ? 'Restoring...' : 'Restore Version'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  )
}

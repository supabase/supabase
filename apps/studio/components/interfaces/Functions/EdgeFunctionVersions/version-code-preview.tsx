import { Button, CodeBlock, LogoLoader, ScrollArea, Skeleton } from 'ui'
import type { EdgeFunctionDeployment } from './types'
import { inferLanguageFromPath, formatDateTime } from './utils'

export type CodeFile = { path?: string; content?: string }

export type VersionCodePreviewProps = {
  selectedDeployment: EdgeFunctionDeployment | null
  codeFiles: CodeFile[]
  isLoading: boolean
  isRestoring: boolean
  onOpenRollback: () => void
}

export const VersionCodePreview = ({
  selectedDeployment,
  codeFiles,
  isLoading,
  isRestoring,
  onOpenRollback,
}: VersionCodePreviewProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <Skeleton className="h-3 w-12 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center justify-center h-[400px] rounded border bg-surface-200">
          <LogoLoader />
        </div>
      </div>
    )
  }

  if (selectedDeployment && codeFiles.length > 0) {
    const firstFile = codeFiles[0]
    const code = firstFile?.content ?? ''
    const path = firstFile?.path ?? ''
    const language = path ? inferLanguageFromPath(path) : 'js'

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="text-foreground font-medium">
              {formatDateTime(selectedDeployment.created_at)}
            </div>
            {selectedDeployment.commit_message && (
              <div className="text-sm text-foreground-light">
                {selectedDeployment.commit_message}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {typeof selectedDeployment.size_kb === 'number' && (
              <div>{selectedDeployment.size_kb.toFixed(1)} KB</div>
            )}
            {selectedDeployment.commit_hash && (
              <div className="font-mono">#{selectedDeployment.commit_hash}</div>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px] rounded border bg-muted p-3 text-xs">
          <CodeBlock
            language={language}
            className="text-xs font-mono border-none p-0 !bg-muted !leading-3 tracking-tight"
          >
            {code}
          </CodeBlock>
        </ScrollArea>

        {selectedDeployment.status === 'ACTIVE' ? (
          <div className="mt-4 rounded-md bg-accent/30 border p-4 text-sm text-foreground">
            This is the currently active version
          </div>
        ) : (
          <div className="mt-4">
            <Button
              block
              type="primary"
              size="medium"
              disabled={isRestoring}
              aria-label={`Restore version ${selectedDeployment.version}`}
              onClick={onOpenRollback}
            >
              Restore This Version
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="text-sm text-muted-foreground h-[400px] rounded border bg-muted flex items-center justify-center">
      No code available
    </div>
  )
}

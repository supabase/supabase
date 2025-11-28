import { Code } from 'lucide-react'
import Link from 'next/link'
import type { DragEvent, ReactNode } from 'react'

import { ReportBlockContainer } from 'components/interfaces/Reports/ReportBlock/ReportBlockContainer'
import { Button, CodeBlock, type CodeBlockLang, cn } from 'ui'
import { Admonition } from 'ui-patterns'

interface EdgeFunctionBlockProps {
  /** Title of the EdgeFunctionBlock */
  label: string
  /** Function code to display */
  code: string
  /** Function name/slug */
  functionName: string
  /** Any other actions specific to the parent to be rendered in the header */
  actions?: ReactNode
  /** Toggle visiblity of code on render */
  showCode?: boolean
  /** Whether function block is draggable */
  draggable?: boolean
  /** Tooltip when hovering over the header of the block */
  tooltip?: ReactNode
  /** Optional callback on drag start */
  onDragStart?: (e: DragEvent) => void
  /** Hide the header deploy button (used when an external confirm footer is shown) */
  hideDeployButton?: boolean
  /** Disable interactive actions */
  disabled?: boolean
  /** Whether a deploy action is currently running */
  isDeploying?: boolean
  /** Whether a deploy action has completed */
  isDeployed?: boolean
  /** Optional message to show when deployment fails */
  errorText?: string
  /** URL to the deployed function */
  functionUrl?: string
  /** Link to the function details page */
  deploymentDetailsUrl?: string
  /** CLI command to download the function */
  downloadCommand?: string
  /** Show warning UI when replacing an existing function */
  showReplaceWarning?: boolean
  /** Cancel handler when replacing an existing function */
  onCancelReplace?: () => void
  /** Confirm handler when replacing an existing function */
  onConfirmReplace?: () => void
  /** Handler for triggering a deploy */
  onDeploy?: () => void
}

export const EdgeFunctionBlock = ({
  label,
  code,
  functionName,
  actions,
  tooltip,
  hideDeployButton = false,
  disabled = false,
  isDeploying = false,
  isDeployed = false,
  errorText,
  functionUrl,
  deploymentDetailsUrl,
  downloadCommand,
  showReplaceWarning = false,
  onCancelReplace,
  onConfirmReplace,
  onDeploy,
  draggable = false,
  onDragStart,
}: EdgeFunctionBlockProps) => {
  const resolvedFunctionUrl = functionUrl ?? 'Function URL will be available after deployment'
  const resolvedDownloadCommand = downloadCommand ?? `supabase functions download ${functionName}`

  const hasStatusMessage = isDeploying || isDeployed || !!errorText

  return (
    <ReportBlockContainer
      tooltip={tooltip}
      icon={<Code size={16} strokeWidth={1.5} className="text-foreground-muted" />}
      label={label}
      loading={isDeploying}
      draggable={draggable}
      onDragStart={onDragStart}
      actions={
        hideDeployButton || !onDeploy ? (
          actions ?? null
        ) : (
          <>
            <Button
              type="outline"
              size="tiny"
              loading={isDeploying}
              disabled={disabled || isDeploying}
              onClick={onDeploy}
            >
              {isDeploying ? 'Deploying...' : 'Deploy'}
            </Button>

            {actions}
          </>
        )
      }
    >
      {showReplaceWarning && (
        <Admonition
          type="warning"
          className="mb-0 rounded-none border-0 border-b shrink-0 bg-background-100"
        >
          <p>An edge function with the name "{functionName}" already exists.</p>
          <p className="text-foreground-light">
            Deploying will replace the existing function. Are you sure you want to proceed?
          </p>
          <div className="flex justify-stretch mt-2 gap-2">
            <Button
              type="outline"
              size="tiny"
              className="w-full flex-1"
              disabled={isDeploying}
              onClick={onCancelReplace}
            >
              Cancel
            </Button>
            <Button
              type="danger"
              size="tiny"
              className="w-full flex-1"
              loading={isDeploying}
              disabled={isDeploying}
              onClick={onConfirmReplace}
            >
              Replace function
            </Button>
          </div>
        </Admonition>
      )}

      <div className="shrink-0 w-full max-h-96 overflow-y-auto">
        <CodeBlock
          hideLineNumbers
          wrapLines={false}
          value={code}
          language={'typescript' as CodeBlockLang}
          className={cn(
            'max-w-none block !bg-transparent !py-3 !px-3.5 prose dark:prose-dark border-0 text-foreground !rounded-none w-full',
            '[&>code]:m-0 [&>code>span]:text-foreground'
          )}
        />
      </div>

      {hasStatusMessage && (
        <div className="p-4 w-full border-t bg-surface-75 text-xs">
          {isDeploying ? (
            <p className="text-foreground-light">Deploying function...</p>
          ) : errorText ? (
            <p className="text-danger">{errorText}</p>
          ) : (
            <>
              <p className="text-foreground-light mb-2">
                The{' '}
                {deploymentDetailsUrl ? (
                  <Link className="text-foreground" href={deploymentDetailsUrl}>
                    new function
                  </Link>
                ) : (
                  <span className="text-foreground">new function</span>
                )}{' '}
                is now live at:
              </p>
              <CodeBlock
                language="bash"
                hideLineNumbers
                value={resolvedFunctionUrl}
                className="text-xs p-2"
              />
              <p className="text-foreground-light mt-4 mb-2">
                To download and work on this function locally, use the CLI command:
              </p>
              <CodeBlock
                hideLineNumbers
                language="bash"
                value={resolvedDownloadCommand}
                className="text-xs p-2"
              />
            </>
          )}
        </div>
      )}
    </ReportBlockContainer>
  )
}

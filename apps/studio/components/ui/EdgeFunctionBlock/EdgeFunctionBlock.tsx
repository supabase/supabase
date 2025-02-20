import { DragEvent, ReactNode, useState } from 'react'
import { toast } from 'sonner'
import { useParams } from 'common'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { ReportBlockContainer } from 'components/interfaces/Reports/ReportBlock/ReportBlockContainer'
import { Button, CodeBlock, cn, CodeBlockLang } from 'ui'
import { Code } from 'lucide-react'
import Link from 'next/link'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
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
  onDragStart?: (e: DragEvent<Element>) => void
}

export const EdgeFunctionBlock = ({
  label,
  code,
  functionName,
  actions,
  showCode: _showCode = false,
  tooltip,
}: EdgeFunctionBlockProps) => {
  const { ref } = useParams()
  const [isDeployed, setIsDeployed] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const { data: existingFunction } = useEdgeFunctionQuery({ projectRef: ref, slug: functionName })

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      setIsDeployed(true)
      toast.success('Successfully deployed edge function')
    },
  })

  const handleDeploy = async () => {
    if (!code || isDeploying || !ref) return

    if (existingFunction) {
      return setShowWarning(true)
    }

    try {
      const deployResult = await deployFunction({
        projectRef: ref,
        metadata: {
          entrypoint_path: 'index.ts',
          name: functionName,
          verify_jwt: true,
        },
        files: [{ name: 'index.ts', content: code }],
      })
    } catch (error) {
      toast.error(
        `Failed to deploy function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  let functionUrl = 'Function URL not available'
  const endpoint = settings?.app_config?.endpoint
  if (endpoint) {
    const restUrl = `https://${endpoint}`
    const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'
    functionUrl =
      ref && functionName && restUrlTld
        ? `https://${ref}.supabase.${restUrlTld}/functions/v1/${functionName}`
        : 'Function URL will be available after deployment'
  }
  return (
    <ReportBlockContainer
      tooltip={tooltip}
      icon={<Code size={16} strokeWidth={1.5} className="text-foreground-muted" />}
      label={label}
      actions={
        ref && functionName ? (
          <>
            <Button
              type="outline"
              size="tiny"
              loading={isDeploying}
              disabled={!ref}
              onClick={handleDeploy}
            >
              {isDeploying ? 'Deploying...' : 'Deploy'}
            </Button>

            {actions}
          </>
        ) : null
      }
    >
      {showWarning && ref && functionName && (
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
              onClick={() => setShowWarning(false)}
            >
              Cancel
            </Button>
            <Button
              type="danger"
              size="tiny"
              className="w-full flex-1"
              onClick={async () => {
                setShowWarning(false)
                try {
                  await deployFunction({
                    projectRef: ref,
                    metadata: {
                      entrypoint_path: 'index.ts',
                      name: functionName,
                      verify_jwt: true,
                    },
                    files: [{ name: 'index.ts', content: code }],
                  })
                } catch (error) {
                  toast.error(
                    `Failed to deploy function: ${error instanceof Error ? error.message : 'Unknown error'}`
                  )
                }
              }}
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

      {(isDeploying || isDeployed) && (
        <div className="p-4 w-full border-t bg-surface-75 text-xs">
          {isDeploying ? (
            <p className="text-foreground-light">Deploying function...</p>
          ) : (
            <>
              <p className="text-foreground-light mb-2">
                The{' '}
                <Link
                  className="text-foreground"
                  href={`/project/${ref}/functions/${functionName}/details`}
                >
                  new function
                </Link>{' '}
                is now live at:
              </p>
              <CodeBlock
                language="bash"
                hideLineNumbers
                value={functionUrl}
                className="text-xs p-2"
              />
              <p className="text-foreground-light mt-4 mb-2">
                To download and work on this function locally, use the CLI command:
              </p>
              <CodeBlock
                hideLineNumbers
                language="bash"
                value={`supabase functions download ${functionName}`}
                className="text-xs p-2"
              />
            </>
          )}
        </div>
      )}
    </ReportBlockContainer>
  )
}

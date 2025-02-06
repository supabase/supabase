import { DragEvent, ReactNode, useState } from 'react'
import { toast } from 'sonner'
import { useParams } from 'common'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { ReportBlockContainer } from 'components/interfaces/Reports/ReportBlock/ReportBlockContainer'
import { Button, CodeBlock, cn, CodeBlockLang } from 'ui'
import { Code } from 'lucide-react'

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

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      setIsDeployed(true)
      toast.success('Successfully deployed edge function')
    },
  })

  const handleDeploy = async () => {
    if (!code || isDeploying || !ref) return

    try {
      const deployResult = await deployFunction({
        projectRef: ref,
        metadata: {
          entrypoint_path: 'index.ts',
          name: functionName,
          verify_jwt: false,
        },
        files: [{ name: 'index.ts', content: code }],
      })
    } catch (error) {
      toast.error(
        `Failed to deploy function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const functionUrl = ref ? `https://${ref}.supabase.co/functions/v1/${functionName}` : ''

  return (
    <ReportBlockContainer
      tooltip={tooltip}
      icon={
        <Code
          size={18}
          strokeWidth={1.5}
          className={cn(
            'transition-colors fill-foreground-muted group-aria-selected:fill-foreground',
            'w-5 h-5 shrink-0 grow-0 -ml-0.5'
          )}
        />
      }
      label={label}
      actions={
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
      }
    >
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
                Function deployed successfully! You can now invoke it at:
              </p>
              <CodeBlock hideLineNumbers value={functionUrl} className="text-xs p-2" />
              <p className="text-foreground-light mt-4 mb-2">
                To download and work on this function locally, use the CLI command:
              </p>
              <CodeBlock
                hideLineNumbers
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

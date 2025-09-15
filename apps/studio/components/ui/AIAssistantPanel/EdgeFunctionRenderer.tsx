import { PropsWithChildren, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { ConfirmFooter } from './ConfirmFooter'

interface EdgeFunctionRendererProps {
  label: string
  code: string
  functionName: string
  onDeployed?: (result: { success: true } | { success: false; errorText: string }) => void
}

export const EdgeFunctionRenderer = ({
  label,
  code,
  functionName,
  onDeployed,
}: PropsWithChildren<EdgeFunctionRendererProps>) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const [isRunning, setIsRunning] = useState(false)

  const { mutateAsync: deployFunction } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully deployed edge function')
    },
  })

  const handleDeploy = async () => {
    if (!ref || !functionName) return
    try {
      setIsRunning(true)
      await deployFunction({
        projectRef: ref,
        slug: functionName,
        metadata: {
          entrypoint_path: 'index.ts',
          name: functionName,
          verify_jwt: true,
        },
        files: [{ name: 'index.ts', content: code }],
      })
      sendEvent({
        action: 'edge_function_deploy_button_clicked',
        properties: { origin: 'functions_ai_assistant' },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })
      onDeployed?.({ success: true })
    } catch (e: any) {
      const errMsg = e?.message ?? 'Unknown error'
      toast.error(`Failed to deploy function: ${errMsg}`)
      onDeployed?.({ success: false, errorText: errMsg })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="w-auto overflow-x-hidden my-4">
      <EdgeFunctionBlock label={label} code={code} functionName={functionName} hideDeployButton />
      <div className="mt-2">
        <ConfirmFooter
          message="Assistant wants to deploy this EdgeFunction"
          cancelLabel="Skip"
          confirmLabel={isRunning ? 'Deploying…' : 'Deploy'}
          isLoading={isRunning}
          onCancel={() => onDeployed?.({ success: false, errorText: 'Skipped' })}
          onConfirm={handleDeploy}
        />
      </div>
    </div>
  )
}

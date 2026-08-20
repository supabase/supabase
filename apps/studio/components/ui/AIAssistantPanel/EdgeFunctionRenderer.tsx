import { useParams } from 'common'
import { useMemo, useState } from 'react'

import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { Confirm } from './Confirm'
import { type ConfirmFooterApprovalState } from './Confirm.utils'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useTrack } from '@/lib/telemetry/track'

interface EdgeFunctionRendererProps {
  label: string
  code: string
  functionName: string
  onApprove?: () => void
  onDeny?: () => void
  isDeploying?: boolean
  initialIsDeployed?: boolean
  confirmState?: ConfirmFooterApprovalState
}

export const EdgeFunctionRenderer = ({
  label,
  code,
  functionName,
  onApprove,
  onDeny,
  isDeploying = false,
  initialIsDeployed,
  confirmState,
}: EdgeFunctionRendererProps) => {
  const { ref } = useParams()
  const track = useTrack()
  const [showReplaceWarning, setShowReplaceWarning] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: !!ref })
  const { data: existingFunction } = useEdgeFunctionQuery(
    { projectRef: ref, slug: functionName },
    { enabled: !!ref && !!functionName && !initialIsDeployed }
  )

  const functionUrl = useMemo(() => {
    const endpoint = settings?.app_config?.endpoint
    const protocol = settings?.app_config?.protocol ?? 'https'
    if (!endpoint || !ref || !functionName) return undefined
    return `${protocol}://${endpoint}/functions/v1/${functionName}`
  }, [settings?.app_config?.endpoint, settings?.app_config?.protocol, ref, functionName])

  const deploymentDetailsUrl = useMemo(() => {
    if (!ref || !functionName) return undefined
    return `/project/${ref}/functions/${functionName}/details`
  }, [ref, functionName])

  const downloadCommand = useMemo(() => {
    if (!functionName) return undefined
    return `supabase functions download ${functionName}`
  }, [functionName])

  const approveDeploy = () => {
    if (!code || isDeploying || !ref || !functionName) return

    setShowReplaceWarning(false)
    track('edge_function_deploy_button_clicked', { origin: 'functions_ai_assistant' })
    onApprove?.()
  }

  const handleDeploy = () => {
    if (!code || isDeploying || !ref || !functionName) return

    if (existingFunction) {
      setShowReplaceWarning(true)
      return
    }

    approveDeploy()
  }

  const isConfirming = confirmState !== undefined

  return (
    <Confirm
      className="my-4"
      state={confirmState}
      message="Assistant wants to deploy this Edge Function"
      cancelLabel="Skip"
      confirmLabel="Deploy"
      confirmLabelLoading="Deploying..."
      isLoading={isDeploying}
      onCancel={onDeny}
      onConfirm={handleDeploy}
    >
      <EdgeFunctionBlock
        className="rounded-none border-0 shadow-none"
        label={label}
        code={code}
        functionName={functionName}
        disabled={isConfirming}
        isDeploying={isDeploying}
        isDeployed={initialIsDeployed}
        functionUrl={functionUrl}
        deploymentDetailsUrl={deploymentDetailsUrl}
        downloadCommand={downloadCommand}
        hideDeployButton={isConfirming || initialIsDeployed}
        showReplaceWarning={showReplaceWarning}
        onCancelReplace={() => setShowReplaceWarning(false)}
        onConfirmReplace={approveDeploy}
      />
    </Confirm>
  )
}

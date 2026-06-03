import { useParams } from 'common'
import { useMemo, useState, type PropsWithChildren } from 'react'

import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { useAssistantToolApprovalOptional } from './AssistantToolApprovalContext'
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
  isAwaitingUserApproval?: boolean
}

export const EdgeFunctionRenderer = ({
  label,
  code,
  functionName,
  onApprove,
  isDeploying = false,
  initialIsDeployed,
  isAwaitingUserApproval = false,
}: PropsWithChildren<EdgeFunctionRendererProps>) => {
  const { ref } = useParams()
  const track = useTrack()
  const [localShowReplaceWarning, setLocalShowReplaceWarning] = useState(false)
  const approvalContext = useAssistantToolApprovalOptional()

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: !!ref })
  const { data: existingFunction } = useEdgeFunctionQuery(
    { projectRef: ref, slug: functionName },
    { enabled: !!ref && !!functionName && !initialIsDeployed }
  )

  const functionUrl = useMemo(() => {
    const endpoint = settings?.app_config?.endpoint
    if (!endpoint || !ref || !functionName) return undefined

    try {
      const url = new URL(`https://${endpoint}`)
      const restUrlTld = url.hostname.split('.').pop()
      return restUrlTld
        ? `https://${ref}.supabase.${restUrlTld}/functions/v1/${functionName}`
        : undefined
    } catch (error) {
      return undefined
    }
  }, [settings?.app_config?.endpoint, ref, functionName])

  const deploymentDetailsUrl = useMemo(() => {
    if (!ref || !functionName) return undefined
    return `/project/${ref}/functions/${functionName}/details`
  }, [ref, functionName])

  const downloadCommand = useMemo(() => {
    if (!functionName) return undefined
    return `supabase functions download ${functionName}`
  }, [functionName])

  const showReplaceWarning = isAwaitingUserApproval
    ? (approvalContext?.edgeFunctionReplaceWarning ?? false)
    : localShowReplaceWarning

  const setShowReplaceWarning = isAwaitingUserApproval
    ? (value: boolean) => approvalContext?.setEdgeFunctionReplaceWarning(value)
    : setLocalShowReplaceWarning

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

  return (
    <div className="w-auto overflow-x-hidden my-4">
      <EdgeFunctionBlock
        label={label}
        code={code}
        functionName={functionName}
        disabled={isAwaitingUserApproval}
        isDeploying={isDeploying}
        isDeployed={initialIsDeployed}
        functionUrl={functionUrl}
        deploymentDetailsUrl={deploymentDetailsUrl}
        downloadCommand={downloadCommand}
        hideDeployButton={isAwaitingUserApproval || initialIsDeployed}
        showReplaceWarning={showReplaceWarning}
        onCancelReplace={() => setShowReplaceWarning(false)}
        onConfirmReplace={approveDeploy}
        onDeploy={handleDeploy}
      />
    </div>
  )
}

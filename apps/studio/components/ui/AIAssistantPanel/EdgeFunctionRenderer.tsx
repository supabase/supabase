import { useParams } from 'common'
import { useMemo, useState, type PropsWithChildren } from 'react'

import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { ConfirmFooter } from './ConfirmFooter'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface EdgeFunctionRendererProps {
  label: string
  code: string
  functionName: string
  onApprove?: () => void
  onDeny?: () => void
  isDeploying?: boolean
  initialIsDeployed?: boolean
  showConfirmFooter?: boolean
}

export const EdgeFunctionRenderer = ({
  label,
  code,
  functionName,
  onApprove,
  onDeny,
  isDeploying = false,
  initialIsDeployed,
  showConfirmFooter = true,
}: PropsWithChildren<EdgeFunctionRendererProps>) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const [showReplaceWarning, setShowReplaceWarning] = useState(false)

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

  const approveDeploy = () => {
    if (!code || isDeploying || !ref || !functionName) return

    setShowReplaceWarning(false)
    sendEvent({
      action: 'edge_function_deploy_button_clicked',
      properties: { origin: 'functions_ai_assistant' },
      groups: {
        project: ref ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })
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
        disabled={showConfirmFooter}
        isDeploying={isDeploying}
        isDeployed={initialIsDeployed}
        functionUrl={functionUrl}
        deploymentDetailsUrl={deploymentDetailsUrl}
        downloadCommand={downloadCommand}
        hideDeployButton={showConfirmFooter || initialIsDeployed}
        showReplaceWarning={showReplaceWarning}
        onCancelReplace={() => setShowReplaceWarning(false)}
        onConfirmReplace={approveDeploy}
      />
      {showConfirmFooter && (
        <div className="mx-4">
          <ConfirmFooter
            message="Assistant wants to deploy this Edge Function"
            cancelLabel="Skip"
            confirmLabel={isDeploying ? 'Deploying...' : 'Deploy'}
            isLoading={isDeploying}
            onCancel={() => onDeny?.()}
            onConfirm={handleDeploy}
          />
        </div>
      )}
    </div>
  )
}

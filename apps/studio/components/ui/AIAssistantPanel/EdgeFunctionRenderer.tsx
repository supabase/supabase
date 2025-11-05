import { type PropsWithChildren, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
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
  initialIsDeployed?: boolean
  showConfirmFooter?: boolean
}

export const EdgeFunctionRenderer = ({
  label,
  code,
  functionName,
  onDeployed,
  initialIsDeployed,
  showConfirmFooter = true,
}: PropsWithChildren<EdgeFunctionRendererProps>) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const [isDeployed, setIsDeployed] = useState(!!initialIsDeployed)
  const [showReplaceWarning, setShowReplaceWarning] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: !!ref })
  const { data: existingFunction } = useEdgeFunctionQuery(
    { projectRef: ref, slug: functionName },
    { enabled: !!ref && !!functionName }
  )

  const {
    mutate: deployFunction,
    error: deployError,
    isLoading: isDeploying,
  } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      setIsDeployed(true)
      toast.success('Successfully deployed edge function')
      onDeployed?.({ success: true })
    },
    onError: (error) => {
      const errMsg = error?.message ?? 'Unknown error'
      const message = `Failed to deploy function: ${errMsg}`
      toast.error(message)
      setIsDeployed(false)
      onDeployed?.({ success: false, errorText: errMsg })
    },
  })

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

  const performDeploy = async () => {
    if (!ref || !functionName || !code) return

    deployFunction({
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
      groups: {
        project: ref ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })

    setShowReplaceWarning(false)
  }

  const handleDeploy = () => {
    if (!code || isDeploying || !ref) return

    if (existingFunction) {
      setShowReplaceWarning(true)
      return
    }

    void performDeploy()
  }

  return (
    <div className="w-auto overflow-x-hidden my-4">
      <EdgeFunctionBlock
        label={label}
        code={code}
        functionName={functionName}
        disabled={showConfirmFooter}
        isDeploying={isDeploying}
        isDeployed={isDeployed}
        errorText={deployError?.message}
        functionUrl={functionUrl}
        deploymentDetailsUrl={deploymentDetailsUrl}
        downloadCommand={downloadCommand}
        showReplaceWarning={showReplaceWarning}
        onCancelReplace={() => setShowReplaceWarning(false)}
        onConfirmReplace={() => void performDeploy()}
        onDeploy={handleDeploy}
        hideDeployButton={showConfirmFooter}
      />
      {showConfirmFooter && (
        <div className="mx-4">
          <ConfirmFooter
            message="Assistant wants to deploy this Edge Function"
            cancelLabel="Skip"
            confirmLabel={isDeploying ? 'Deploying...' : 'Deploy'}
            isLoading={isDeploying}
            onCancel={() => {
              onDeployed?.({ success: false, errorText: 'Skipped' })
            }}
            onConfirm={() => handleDeploy()}
          />
        </div>
      )}
    </div>
  )
}

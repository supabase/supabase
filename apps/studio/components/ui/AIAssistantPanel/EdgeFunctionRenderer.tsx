import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
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
  showConfirmFooter?: boolean
}

export const EdgeFunctionRenderer = ({
  label,
  code,
  functionName,
  onDeployed,
  showConfirmFooter = true,
}: PropsWithChildren<EdgeFunctionRendererProps>) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const [isDeploying, setIsDeploying] = useState(false)
  const [isDeployed, setIsDeployed] = useState(false)
  const [errorText, setErrorText] = useState<string>()
  const [showReplaceWarning, setShowReplaceWarning] = useState(false)
  const [hasDecision, setHasDecision] = useState(false)
  const [hasExistingFunction, setHasExistingFunction] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: !!ref })
  const { data: existingFunction } = useEdgeFunctionQuery(
    { projectRef: ref, slug: functionName },
    { enabled: !!ref && !!functionName }
  )

  const { mutateAsync: deployFunction } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully deployed edge function')
    },
  })

  useEffect(() => {
    setIsDeploying(false)
    setIsDeployed(false)
    setErrorText(undefined)
    setShowReplaceWarning(false)
    setHasDecision(false)
    setHasExistingFunction(false)
  }, [code, functionName, ref])

  useEffect(() => {
    if (existingFunction) {
      setHasExistingFunction(true)
    }
  }, [existingFunction])

  const functionUrl = useMemo(() => {
    const endpoint = settings?.app_config?.endpoint
    if (!endpoint || !ref || !functionName) return undefined

    try {
      const url = new URL(`https://${endpoint}`)
      const restUrlTld = url.hostname.split('.').pop()
      return restUrlTld ? `https://${ref}.supabase.${restUrlTld}/functions/v1/${functionName}` : undefined
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

    setIsDeploying(true)
    setErrorText(undefined)

    try {
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

      setIsDeployed(true)
      setHasExistingFunction(true)
      setHasDecision(true)
      onDeployed?.({ success: true })
    } catch (e: any) {
      const errMsg = e?.message ?? 'Unknown error'
      const message = `Failed to deploy function: ${errMsg}`
      toast.error(message)
      setIsDeployed(false)
      setErrorText(message)
      setHasDecision(true)
      onDeployed?.({ success: false, errorText: errMsg })
    } finally {
      setIsDeploying(false)
      setShowReplaceWarning(false)
    }
  }

  const handleDeploy = () => {
    if (!code || isDeploying || !ref) return

    if (hasExistingFunction) {
      setShowReplaceWarning(true)
      return
    }

    void performDeploy()
  }

  const shouldShowConfirmFooter = showConfirmFooter && !hasDecision

  return (
    <div className="w-auto overflow-x-hidden my-4">
      <EdgeFunctionBlock
        label={label}
        code={code}
        functionName={functionName}
        disabled={shouldShowConfirmFooter}
        isDeploying={isDeploying}
        isDeployed={isDeployed}
        errorText={errorText}
        functionUrl={functionUrl}
        deploymentDetailsUrl={deploymentDetailsUrl}
        downloadCommand={downloadCommand}
        showReplaceWarning={showReplaceWarning}
        onCancelReplace={() => setShowReplaceWarning(false)}
        onConfirmReplace={() => void performDeploy()}
        onDeploy={handleDeploy}
      />
      {shouldShowConfirmFooter && (
        <div className="mx-4">
          <ConfirmFooter
            message="Assistant wants to deploy this EdgeFunction"
            cancelLabel="Skip"
            confirmLabel={isDeploying ? 'Deploying…' : 'Deploy'}
            isLoading={isDeploying}
            onCancel={() => {
              setHasDecision(true)
              onDeployed?.({ success: false, errorText: 'Skipped' })
            }}
            onConfirm={() => handleDeploy()}
          />
        </div>
      )}
    </div>
  )
}

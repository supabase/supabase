import { useParams } from 'common'
import { useMemo, type PropsWithChildren } from 'react'

import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { ConfirmFooter } from './ConfirmFooter'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'

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

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: !!ref })

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
      />
      {showConfirmFooter && (
        <div className="mx-4">
          <ConfirmFooter
            message="Assistant wants to deploy this Edge Function"
            cancelLabel="Skip"
            confirmLabel={isDeploying ? 'Deploying...' : 'Deploy'}
            isLoading={isDeploying}
            onCancel={() => onDeny?.()}
            onConfirm={() => onApprove?.()}
          />
        </div>
      )}
    </div>
  )
}

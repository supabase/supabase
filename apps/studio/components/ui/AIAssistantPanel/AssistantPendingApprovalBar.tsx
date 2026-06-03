import { useParams } from 'common'
import { useEffect } from 'react'

import type { ActiveToolApproval } from './AIAssistant.utils'
import { useAssistantToolApprovalOptional } from './AssistantToolApprovalContext'
import { ConfirmFooter } from './ConfirmFooter'
import type { AddToolApprovalResponse } from './Message.Context'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useTrack } from '@/lib/telemetry/track'

interface AssistantPendingApprovalBarProps {
  activeApproval: ActiveToolApproval | null
  addToolApprovalResponse?: AddToolApprovalResponse
}

export function AssistantPendingApprovalBar({
  activeApproval,
  addToolApprovalResponse,
}: AssistantPendingApprovalBarProps) {
  const { ref } = useParams()
  const track = useTrack()
  const approvalContext = useAssistantToolApprovalOptional()
  const setEdgeFunctionReplaceWarning = approvalContext?.setEdgeFunctionReplaceWarning

  const isEdgeFunctionApproval = activeApproval?.kind === 'deploy_edge_function'
  const functionName = isEdgeFunctionApproval ? activeApproval.functionName : ''

  const { data: existingFunction } = useEdgeFunctionQuery(
    { projectRef: ref, slug: functionName },
    { enabled: !!ref && !!functionName && isEdgeFunctionApproval }
  )

  useEffect(() => {
    if (!activeApproval) {
      setEdgeFunctionReplaceWarning?.(false)
    }
  }, [activeApproval, setEdgeFunctionReplaceWarning])

  if (!activeApproval || !addToolApprovalResponse) return null

  const isLoading = activeApproval.status === 'running'
  const isPending = activeApproval.status === 'pending'

  const handleCancel = () => {
    addToolApprovalResponse({ id: activeApproval.approvalId, approved: false })
    setEdgeFunctionReplaceWarning?.(false)
  }

  const handleConfirm = () => {
    if (!isPending) return

    if (activeApproval.kind === 'deploy_edge_function' && existingFunction) {
      setEdgeFunctionReplaceWarning?.(true)
      return
    }

    if (activeApproval.kind === 'deploy_edge_function') {
      track('edge_function_deploy_button_clicked', { origin: 'functions_ai_assistant' })
    }

    addToolApprovalResponse({ id: activeApproval.approvalId, approved: true })
    setEdgeFunctionReplaceWarning?.(false)
  }

  const copy =
    activeApproval.kind === 'execute_sql'
      ? {
          message: 'Assistant wants to run this query',
          cancelLabel: 'Skip',
          confirmLabel: 'Run Query',
          confirmLabelLoading: 'Running...',
        }
      : {
          message: 'Assistant wants to deploy this Edge Function',
          cancelLabel: 'Skip',
          confirmLabel: 'Deploy',
          confirmLabelLoading: 'Deploying...',
        }

  return (
    <div className="absolute bottom-full left-0 right-0 z-30 mb-2">
      <ConfirmFooter
        placement="overhang"
        message={copy.message}
        cancelLabel={copy.cancelLabel}
        confirmLabel={copy.confirmLabel}
        confirmLabelLoading={copy.confirmLabelLoading}
        isLoading={isLoading}
        onCancel={isPending ? handleCancel : undefined}
        onConfirm={isPending ? handleConfirm : undefined}
      />
    </div>
  )
}

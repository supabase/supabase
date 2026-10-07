import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { z } from 'zod'

import { AI_OPT_IN_LEVEL_LABELS } from './AiAssistant.constants'
import { AIOptInModal } from './AIOptInModal'
import { Confirm } from './Confirm'
import type { ConfirmFooterApprovalState } from './Confirm.utils'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useOrgAiOptInLevel, type AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { optInLevelSchema } from '@/lib/ai/tool-filter'

const updateOptInLevelOutputSchema = z.object({
  level: optInLevelSchema,
  sufficient: z.boolean().optional(),
})

interface OptInRequestProps {
  /** Omitted when the Assistant is only asking the user to review the setting. */
  requiredLevel?: AiOptInLevel
  /** The org's level when the Assistant asked. Falls back to the live level on older chats. */
  levelAtRequest?: AiOptInLevel
  output?: unknown
  confirmState?: ConfirmFooterApprovalState
  onApprove?: () => void
  onDeny?: () => void
}

/** Approval card for `update_opt_in_level`. Saving in the modal approves, Skip denies. */
export const OptInRequest = ({
  requiredLevel,
  levelAtRequest,
  output,
  confirmState,
  onApprove,
  onDeny,
}: OptInRequestProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const { aiOptInLevel: liveLevel } = useOrgAiOptInLevel()
  const aiOptInLevel = levelAtRequest ?? liveLevel
  const { can: canUpdateOrganization } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )

  const requiredLabel = requiredLevel && AI_OPT_IN_LEVEL_LABELS[requiredLevel]
  const result = updateOptInLevelOutputSchema.safeParse(output).data
  // Saving a lower level still approves the call
  const isBelowRequest = confirmState === 'success' && result?.sufficient === false

  const newLevel = result?.level
  const successMessage =
    newLevel && newLevel !== aiOptInLevel
      ? `Opt-in level updated to ${AI_OPT_IN_LEVEL_LABELS[newLevel]}`
      : `Opt-in level is still ${AI_OPT_IN_LEVEL_LABELS[aiOptInLevel]}`

  let message = 'Only an owner or administrator can change the opt-in level'
  if (canUpdateOrganization) message = 'Assistant wants you to review the opt-in level'
  if (requiredLabel) {
    message = canUpdateOrganization
      ? `Assistant wants ${requiredLabel} access`
      : `The Assistant will answer without ${requiredLabel} access`
  }

  return (
    <>
      <Confirm
        state={isBelowRequest ? 'error' : confirmState}
        className="my-4"
        message={message}
        successMessage={successMessage}
        errorMessage={`${requiredLabel} access was not granted`}
        cancelLabel={canUpdateOrganization ? 'Skip' : 'Continue'}
        deniedMessage={
          canUpdateOrganization
            ? 'Skipped opt-in request'
            : 'Continued without changing the opt-in level'
        }
        confirmLabel="Review opt-in level"
        denyOnly={!canUpdateOrganization}
        onCancel={onDeny}
        onConfirm={() => setIsModalVisible(true)}
      >
        {canUpdateOrganization ? (
          <div className="p-4 text-sm">
            <p className="text-foreground">
              {requiredLabel ? `${requiredLabel} access needed` : 'Review opt-in level'}
            </p>
            <p className="text-foreground-light">
              {requiredLabel &&
                `The Assistant needs the ${requiredLabel} opt-in level to answer this. `}
              Your organization is set to {AI_OPT_IN_LEVEL_LABELS[aiOptInLevel]}.
            </p>
          </div>
        ) : (
          <NoPermission resourceText="change the Assistant's opt-in level" />
        )}
      </Confirm>
      <AIOptInModal
        visible={isModalVisible}
        requiredLevel={requiredLevel}
        onCancel={() => setIsModalVisible(false)}
        onSaved={() => onApprove?.()}
      />
    </>
  )
}

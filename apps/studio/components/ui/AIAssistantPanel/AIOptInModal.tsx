import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { AIOptInLevelSelector } from '@/components/interfaces/Organization/GeneralSettings/AIOptInLevelSelector'
import { useAIOptInForm } from '@/hooks/forms/useAIOptInForm'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { isOptInLevelAtLeast } from '@/lib/ai/tool-filter'

interface AIOptInModalProps {
  visible: boolean
  onCancel: () => void
  /** The level the Assistant asked for. Shows it as proposed. */
  requiredLevel?: AiOptInLevel
  /** Called after the level is saved. */
  onSaved?: (level: AiOptInLevel) => void
}

export const AIOptInModal = ({ visible, onCancel, requiredLevel, onSaved }: AIOptInModalProps) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const { form, onSubmit, isUpdating, currentOptInLevel } = useAIOptInForm((level) => {
    onSaved?.(level)
    onCancel()
  })
  const { can: canUpdateOrganization } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onCancel()
    }
  }

  const proposedLevel =
    requiredLevel && !isOptInLevelAtLeast(currentOptInLevel, requiredLevel)
      ? requiredLevel
      : undefined

  useEffect(() => {
    if (visible) {
      form.reset({ aiOptInLevel: currentOptInLevel })
    }
  }, [visible, currentOptInLevel, form])

  return (
    <Dialog open={visible} onOpenChange={onOpenChange}>
      <DialogContent size="large" aria-describedby={undefined}>
        <Form {...form}>
          <form id="ai-opt-in-form" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader padding="small">
              <DialogTitle>Update Supabase Assistant Opt-in Level</DialogTitle>
            </DialogHeader>

            <DialogSectionSeparator />

            <DialogSection className="space-y-4 pb-0" padding="small">
              {proposedLevel && (
                <Admonition
                  type="default"
                  title="The Assistant needs more access to answer your question"
                  description={`This applies to every project in ${organization?.name ?? 'this organization'}.`}
                />
              )}
              <AIOptInLevelSelector
                control={form.control}
                disabled={!canUpdateOrganization || isUpdating}
                currentLevel={proposedLevel && currentOptInLevel}
                proposedLevel={proposedLevel}
              />
            </DialogSection>

            <DialogFooter
              padding="small"
              className={cn(!canUpdateOrganization && 'justify-between!')}
            >
              {!canUpdateOrganization && (
                <p className="text-sm text-foreground-lighter">
                  You need additional permissions to update the opt-in level
                </p>
              )}
              <div className="flex items-center gap-x-2">
                <Button disabled={isUpdating} onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  form="ai-opt-in-form"
                  loading={isUpdating}
                  disabled={isUpdating || !canUpdateOrganization || !form.formState.isDirty}
                >
                  Confirm
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

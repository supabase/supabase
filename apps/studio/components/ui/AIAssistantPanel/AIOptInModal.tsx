import { useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
} from 'ui'
import { useAIOptInForm } from 'hooks/forms/useAIOptInForm'
import { AIOptInLevelSelector } from 'components/interfaces/Organization/GeneralSettings/AIOptInLevelSelector'

interface AIOptInModalProps {
  visible: boolean
  onCancel: () => void
}

export const AIOptInModal = ({ visible, onCancel }: AIOptInModalProps) => {
  const { form, onSubmit, isUpdating, canUpdateOrganization, currentOptInLevel } =
    useAIOptInForm(onCancel)

  useEffect(() => {
    if (visible) {
      form.reset({ aiOptInLevel: currentOptInLevel })
    }
  }, [visible, currentOptInLevel, form.reset])

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onCancel()
    }
  }

  return (
    <Dialog open={visible} onOpenChange={onOpenChange}>
      <DialogContent size="large">
        <Form_Shadcn_ {...form}>
          <form id="ai-opt-in-form" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader padding="small">
              <DialogTitle>Update Supabase Assistant Opt-in Level</DialogTitle>
            </DialogHeader>
            <DialogSectionSeparator />
            <DialogSection className="space-y-4" padding="small">
              <AIOptInLevelSelector
                control={form.control}
                disabled={!canUpdateOrganization || isUpdating}
              />
            </DialogSection>
            <DialogSectionSeparator />
            <DialogFooter padding="small">
              <Button type="default" disabled={isUpdating} onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                form="ai-opt-in-form"
                loading={isUpdating}
                disabled={isUpdating || !canUpdateOrganization || !form.formState.isDirty}
              >
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}

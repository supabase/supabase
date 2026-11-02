import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
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
import * as z from 'zod'

import { RolePasswordField } from './RolePasswordField'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useDatabaseRoleUpdateMutation } from '@/data/database-roles/database-role-update-mutation'
import type { PgRole } from '@/data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

const FORM_ID = 'reset-role-password-form'

const FormSchema = z.object({
  password: z.string().min(1, 'You must provide a password'),
})

interface ResetRolePasswordDialogProps {
  role: PgRole
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ResetRolePasswordDialog = ({
  role,
  open,
  onOpenChange,
}: ResetRolePasswordDialogProps) => {
  const { data: project } = useSelectedProjectQuery()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { password: '' },
  })
  const { isDirty } = form.formState

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: discardChangesModalProps,
  } = useConfirmOnClose({ checkIsDirty: () => isDirty, onClose: handleClose })

  const { mutate: updateDatabaseRole, isPending: isUpdating } = useDatabaseRoleUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully reset the password for role "${role.name}"`)
      handleClose()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = ({ password }) => {
    if (!project) return
    updateDatabaseRole({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: role.id,
      payload: { password },
    })
  }

  return (
    <>
      {/* Dismissing mid-update would offer to discard a password that is still being saved */}
      <Dialog open={open} onOpenChange={(nextOpen) => !isUpdating && handleOpenChange(nextOpen)}>
        <DialogContent size="medium">
          <DialogHeader>
            <DialogTitle>Reset password for "{role.name}"</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="w-full space-y-8">
            <Admonition type="warning" title="New connections must use the new password">
              Existing sessions stay connected. Apps, ORMs, and tools that open a new connection as
              this role will fail to sign in until you update them with the new password.
            </Admonition>
            <Form {...form}>
              <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
                <RolePasswordField isOptional={false} layout="vertical" />
              </form>
            </Form>
          </DialogSection>
          <DialogFooter>
            <Button disabled={isUpdating} onClick={confirmOnClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={FORM_ID}
              disabled={!project}
              loading={isUpdating}
            >
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DiscardChangesConfirmationDialog
        {...discardChangesModalProps}
        description="Are you sure you want to discard your changes? The new password will not be saved."
      />
    </>
  )
}

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
import { useDatabaseRoleUpdateMutation } from '@/data/database-roles/database-role-update-mutation'
import type { PgRole } from '@/data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="medium">
        <ResetRolePasswordForm role={role} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

// Rendered inside the dialog content, which only mounts while open, so the form starts empty each time
const ResetRolePasswordForm = ({ role, onClose }: { role: PgRole; onClose: () => void }) => {
  const { data: project } = useSelectedProjectQuery()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { password: '' },
  })

  const { mutate: updateDatabaseRole, isPending: isUpdating } = useDatabaseRoleUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully reset the password for role "${role.name}"`)
      onClose()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = ({ password }) => {
    if (!project) return console.error('Project is required')
    updateDatabaseRole({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: role.id,
      payload: { password },
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reset password for "{role.name}"</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="w-full space-y-8">
        <Admonition type="warning" title="Anything using the old password will be disconnected">
          Apps, ORMs, and tools that connect as this role will fail to sign in until you update them
          with the new password.
        </Admonition>
        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <RolePasswordField isOptional={false} layout="vertical" />
          </form>
        </Form>
      </DialogSection>
      <DialogFooter>
        <Button disabled={isUpdating} onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form={FORM_ID} loading={isUpdating}>
          Reset password
        </Button>
      </DialogFooter>
    </>
  )
}

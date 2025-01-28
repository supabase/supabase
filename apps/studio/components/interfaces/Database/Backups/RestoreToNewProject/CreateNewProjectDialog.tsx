import { zodResolver } from '@hookform/resolvers/zod'
import { debounce } from 'lodash'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useProjectCloneMutation } from 'data/projects/clone-mutation'
import { useCloneBackupsQuery } from 'data/projects/clone-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { passwordStrength } from 'lib/helpers'
import { generateStrongPassword } from 'lib/project'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { AdditionalMonthlySpend } from './AdditionalMonthlySpend'

interface CreateNewProjectDialogProps {
  open: boolean
  selectedBackupId: number | null
  recoveryTimeTarget: number | null
  onOpenChange: (value: boolean) => void
  onCloneSuccess: () => void
}

export const CreateNewProjectDialog = ({
  open,
  selectedBackupId,
  recoveryTimeTarget,
  onOpenChange,
  onCloneSuccess,
}: CreateNewProjectDialogProps) => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')

  const FormSchema = z.object({
    name: z.string().min(1),
    password: z.string().min(1),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      password: '',
    },
  })

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const isFreePlan = subscription?.plan?.id === 'free'

  const { data: cloneBackups } = useCloneBackupsQuery(
    { projectRef: project?.ref },
    { enabled: !isFreePlan }
  )
  const hasPITREnabled = cloneBackups?.pitr_enabled

  const { mutate: triggerClone, isLoading: cloneMutationLoading } = useProjectCloneMutation({
    onError: (error) => {
      console.error('error', error)
      toast.error('Failed to restore to new project')
    },
    onSuccess: () => {
      toast.success('Restoration process started')
      onCloneSuccess()
    },
  })

  const delayedCheckPasswordStrength = useRef(
    debounce((value: string) => checkPasswordStrength(value), 300)
  ).current

  async function checkPasswordStrength(value: string) {
    const { message, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthMessage(message)
  }

  const generatePassword = () => {
    const password = generateStrongPassword()
    form.setValue('password', password)
    delayedCheckPasswordStrength(password)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b">
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>
            This process will create a new project and restore your database to it.
          </DialogDescription>
        </DialogHeader>
        <Form_Shadcn_ {...form}>
          <form
            id={'create-new-project-form'}
            onSubmit={form.handleSubmit((data) => {
              if (!project?.ref) {
                toast.error('Project ref is required')
                return
              }

              if (hasPITREnabled && recoveryTimeTarget) {
                triggerClone({
                  projectRef: project?.ref,
                  newProjectName: data.name,
                  newDbPass: data.password,
                  recoveryTimeTarget: recoveryTimeTarget,
                  cloneBackupId: undefined,
                })
              } else if (selectedBackupId) {
                triggerClone({
                  projectRef: project?.ref,
                  cloneBackupId: selectedBackupId,
                  newProjectName: data.name,
                  newDbPass: data.password,
                  recoveryTimeTarget: undefined,
                })
              } else {
                toast.error('No backup or point in time selected')
                return
              }
            })}
          >
            <DialogSection className="pb-6 space-y-4 text-sm">
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout label="New Project Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ placeholder="Enter a name" type="text" {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItemLayout>
                    <FormControl_Shadcn_>
                      <Input
                        id="db-password"
                        label="Database Password"
                        type="password"
                        placeholder="Type in a strong password"
                        value={field.value}
                        copy={field.value?.length > 0}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value)
                          if (value == '') {
                            setPasswordStrengthScore(-1)
                            setPasswordStrengthMessage('')
                          } else delayedCheckPasswordStrength(value)
                        }}
                        descriptionText={
                          <PasswordStrengthBar
                            passwordStrengthScore={passwordStrengthScore}
                            password={field.value}
                            passwordStrengthMessage={passwordStrengthMessage}
                            generateStrongPassword={generatePassword}
                          />
                        }
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <AdditionalMonthlySpend />
            <DialogFooter>
              <Button htmlType="reset" type="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button htmlType="submit" loading={cloneMutationLoading}>
                Restore to new project
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}

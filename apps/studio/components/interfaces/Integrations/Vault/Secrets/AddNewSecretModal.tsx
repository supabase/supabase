import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useVaultSecretCreateMutation } from 'data/vault/vault-secret-create-mutation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

interface AddNewSecretModalProps {
  disabled: boolean
}

const SecretSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your secret'),
  description: z.string().optional(),
  secret: z.string().min(1, 'Please enter your secret value'),
})

const AddNewSecretModal = ({ disabled }: AddNewSecretModalProps) => {
  const [visible, setVisible] = useState(false)
  const [showSecretValue, setShowSecretValue] = useState(false)
  const { project } = useProjectContext()
  const formId = 'add-vault-secret-form'
  const form = useForm<z.infer<typeof SecretSchema>>({
    resolver: zodResolver(SecretSchema),
    defaultValues: {
      name: '',
      description: '',
      secret: '',
    },
  })

  const { mutate: addSecret, isLoading } = useVaultSecretCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SecretSchema>> = async (values) => {
    if (!project) return console.error('Project is required')

    addSecret(
      {
        projectRef: project.ref,
        connectionString: project?.connectionString,
        name: values.name,
        description: values.description,
        secret: values.secret,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully added new secret ${values.name}`)
          setVisible(false)
        },
      }
    )
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
        }
        setVisible(open)
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          type="primary"
          disabled={disabled}
          onClick={() => {
            setVisible(true)
          }}
          tooltip={{
            content: {
              side: 'bottom',
              text: disabled ? 'You need additional permissions to add secrets' : undefined,
            },
          }}
        >
          Add new secret
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add secret</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              autoComplete="off"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="name" label="Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ id="name" {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                key="description"
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="description" label="Description" labelOptional="Optional">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ id="description" {...field} data-lpignore="true" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                key="secret"
                name="secret"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="secret" label="Secret value">
                    <FormControl_Shadcn_>
                      <div className="relative">
                        <Input_Shadcn_
                          id="secret"
                          type={showSecretValue ? 'text' : 'password'}
                          {...field}
                          data-lpignore="true"
                        />
                        <Button
                          type="default"
                          title={showSecretValue ? `Hide value` : `Show value`}
                          aria-label={showSecretValue ? `Hide value` : `Show value`}
                          className="absolute right-2 top-1 px-3 py-2"
                          icon={showSecretValue ? <EyeOff /> : <Eye />}
                          onClick={() => setShowSecretValue(!showSecretValue)}
                        />
                      </div>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button
            type="default"
            disabled={isLoading}
            onClick={() => {
              form.reset()
              setVisible(false)
            }}
          >
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isLoading}>
            Add secret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddNewSecretModal

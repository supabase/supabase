import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { SubmitHandler, useForm, type UseFormReturn } from 'react-hook-form'
import { useLatest } from 'react-use'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Form,
  FormControl,
  FormField,
  Input,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import { useSecretsCreateMutation } from '@/data/secrets/secrets-create-mutation'
import type { ProjectSecret } from '@/data/secrets/secrets-query'
import { useConfirmOnClose, type ConfirmOnCloseModalProps } from '@/hooks/ui/useConfirmOnClose'

const FORM_ID = 'edit-env-var-sidepanel'

const FormSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your variable'),
  value: z.string().min(1, 'Please provide a value for your variable'),
})

type FormSchemaType = z.infer<typeof FormSchema>

interface EditEnvironmentVariableSheetProps {
  secret?: ProjectSecret
  visible: boolean
  onClose: () => void
}

export function EditEnvironmentVariableSheet({
  secret,
  visible,
  onClose,
}: EditEnvironmentVariableSheetProps) {
  const secretName = useLatest(secret?.name)
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
  })
  useEffect(() => {
    if (visible) {
      form.reset({
        name: secretName.current ?? '',
        value: '',
      })
    }
  }, [form, secretName, visible])
  const isValid = form.formState.isValid

  const { ref: projectRef } = useParams()
  const { mutate: updateSecret, isPending: isUpdating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated variable "${variables.secrets[0].name}"`)
      onClose()
    },
  })
  const onSubmit: SubmitHandler<FormSchemaType> = async ({ name, value }) => {
    updateSecret({
      projectRef,
      secrets: [{ name, value }],
    })
  }

  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty: () => form.formState.isDirty,
    onClose,
  })

  return (
    <Sheet open={visible} onOpenChange={confirmOnClose}>
      <SheetContent
        showClose={false}
        size={'default'}
        className={'!min-w-screen lg:!min-w-[600px] flex flex-col'}
      >
        <Header />
        <Separator />
        <FormBody form={form} onSubmit={onSubmit} />
        <SheetFooter>
          <Button disabled={isUpdating} variant="default" onClick={confirmOnClose}>
            Cancel
          </Button>
          <Button form={FORM_ID} type="submit" disabled={!isValid} loading={isUpdating}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
      <CloseConfirmationModal {...closeConfirmationModalProps} />
    </Sheet>
  )
}

const Header = (): ReactNode => {
  return (
    <SheetHeader className="py-3 flex flex-row gap-3 items-center border-b-0">
      <SheetClose
        className={cn(
          'text-muted hover:text ring-offset-background hover:opacity-100',
          'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none data-[state=open]:bg-secondary',
          'transition'
        )}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Close</span>
      </SheetClose>
      <SheetTitle>Edit environment variable</SheetTitle>
    </SheetHeader>
  )
}

type FormBodyProps = {
  form: UseFormReturn<FormSchemaType>
  onSubmit: SubmitHandler<FormSchemaType>
}

const FormBody = ({ form, onSubmit }: FormBodyProps): ReactNode => {
  return (
    <Form {...form}>
      <form id={FORM_ID} className="flex-grow overflow-auto" onSubmit={form.handleSubmit(onSubmit)}>
        <SheetSection>
          <NameField form={form} />
        </SheetSection>
        <Separator />
        <SheetSection className="space-y-4">
          <SecretField form={form} />
        </SheetSection>
        <Separator />
      </form>
    </Form>
  )
}

type NameFieldProps = {
  form: UseFormReturn<FormSchemaType>
}

const NameField = ({ form }: NameFieldProps): ReactNode => {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItemLayout label="Name" layout="horizontal">
          <FormControl>
            <Input {...field} readOnly className="!text-foreground-light cursor-not-allowed" />
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}

type SecretFieldProps = {
  form: UseFormReturn<FormSchemaType>
}

const SecretField = ({ form }: SecretFieldProps): ReactNode => {
  const [showSecretValue, setShowSecretValue] = useState(false)

  return (
    <FormField
      control={form.control}
      name="value"
      render={({ field }) => (
        <FormItemLayout
          label="Value"
          layout="horizontal"
          description="Secrets can't be retrieved once saved. Enter a new value to overwrite the existing value."
        >
          <FormControl>
            <div className="relative w-full">
              <Input
                {...field}
                type={showSecretValue ? 'text' : 'password'}
                placeholder="my-secret-value"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                data-bwignore
              />
              <Button
                variant="text"
                className="absolute right-1 top-1 px-1"
                icon={showSecretValue ? <EyeOff /> : <Eye />}
                onClick={() => setShowSecretValue(!showSecretValue)}
              />
            </div>
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}

const CloseConfirmationModal = ({
  visible,
  onClose,
  onCancel,
}: ConfirmOnCloseModalProps): ReactNode => {
  return (
    <ConfirmationModal
      visible={visible}
      title="Discard changes"
      confirmLabel="Discard"
      onCancel={onCancel}
      onConfirm={onClose}
    >
      <p className="text-sm text-foreground-light">
        There are unsaved changes. Are you sure you want to close the panel? Your changes will be
        lost.
      </p>
    </ConfirmationModal>
  )
}

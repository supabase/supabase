import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { SubmitHandler, useForm, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { DiscardChangesConfirmationDialog } from 'components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import { ProjectSecret } from 'data/secrets/secrets-query'
import { useConfirmOnClose } from 'hooks/ui/useConfirmOnClose'
import { Eye, EyeOff, X } from 'lucide-react'
import { useLatest } from 'react-use'
import {
  Button,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Input_Shadcn_,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const FORM_ID = 'edit-secret-sidepanel'

const FormSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your secret'),
  value: z.string().min(1, 'Please provide a value for your secret'),
})

type FormSchemaType = z.infer<typeof FormSchema>

interface EditSecretSheetProps {
  secret?: ProjectSecret
  visible: boolean
  onClose: () => void
}

export function EditSecretSheet({ secret, visible, onClose }: EditSecretSheetProps) {
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
  const isDirty = form.formState.isDirty

  const { ref: projectRef } = useParams()
  const { mutate: updateSecret, isPending: isUpdating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated secret "${variables.secrets[0].name}"`)
      onClose()
    },
  })
  const onSubmit: SubmitHandler<FormSchemaType> = async ({ name, value }) => {
    updateSecret({
      projectRef,
      secrets: [{ name, value }],
    })
  }

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: closeConfirmationModalProps,
  } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose,
  })

  return (
    <Sheet open={visible} onOpenChange={handleOpenChange}>
      <SheetContent
        showClose={false}
        size={'default'}
        className={'!min-w-screen lg:!min-w-[600px] flex flex-col'}
      >
        <Header />
        <Separator />
        <FormBody form={form} onSubmit={onSubmit} />
        <SheetFooter>
          <Button disabled={isUpdating} type="default" onClick={confirmOnClose}>
            Cancel
          </Button>
          <Button form={FORM_ID} htmlType="submit" disabled={!isValid} loading={isUpdating}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
      <DiscardChangesConfirmationDialog {...closeConfirmationModalProps} />
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
      <SheetTitle>Edit secret</SheetTitle>
    </SheetHeader>
  )
}

type FormBodyProps = {
  form: UseFormReturn<FormSchemaType>
  onSubmit: SubmitHandler<FormSchemaType>
}

const FormBody = ({ form, onSubmit }: FormBodyProps): ReactNode => {
  return (
    <Form_Shadcn_ {...form}>
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
    </Form_Shadcn_>
  )
}

type NameFieldProps = {
  form: UseFormReturn<FormSchemaType>
}

const NameField = ({ form }: NameFieldProps): ReactNode => {
  return (
    <FormField_Shadcn_
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItemLayout label="Name" layout="horizontal">
          <FormControl_Shadcn_>
            <Input_Shadcn_
              {...field}
              readOnly
              className="!text-foreground-light cursor-not-allowed"
            />
          </FormControl_Shadcn_>
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
    <FormField_Shadcn_
      control={form.control}
      name="value"
      render={({ field }) => (
        <FormItemLayout
          label="Value"
          layout="horizontal"
          description="Secrets can’t be retrieved once saved. Enter a new value to overwrite the existing value."
        >
          <FormControl_Shadcn_>
            <Input
              {...field}
              type={showSecretValue ? 'text' : 'password'}
              placeholder="my-secret-value"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              data-bwignore
              actions={
                <div className="mr-1">
                  <Button
                    type="text"
                    className="px-1"
                    icon={showSecretValue ? <EyeOff /> : <Eye />}
                    onClick={() => setShowSecretValue(!showSecretValue)}
                  />
                </div>
              }
            />
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}

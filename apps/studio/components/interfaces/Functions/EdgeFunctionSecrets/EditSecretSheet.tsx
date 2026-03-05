import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { DiscardChangesConfirmationDialog } from 'components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import { ProjectSecret } from 'data/secrets/secrets-query'
import { useConfirmOnClose } from 'hooks/ui/useConfirmOnClose'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useLatest } from 'react-use'
import { toast } from 'sonner'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Input_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

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
  const { ref: projectRef } = useParams()
  const secretName = useLatest(secret?.name)
  const [showSecretValue, setShowSecretValue] = useState(false)

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
  })

  const isValid = form.formState.isValid
  const isDirty = form.formState.isDirty

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

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose,
  })

  useEffect(() => {
    if (visible) {
      form.reset({ name: secretName.current ?? '', value: '' })
    }
  }, [form, secretName, visible])

  return (
    <Sheet open={visible} onOpenChange={handleOpenChange}>
      <SheetContent size="default" className={'!min-w-screen lg:!min-w-[600px] flex flex-col'}>
        <SheetHeader className="py-3 flex flex-row gap-3 items-center">
          <SheetTitle>Edit secret</SheetTitle>
        </SheetHeader>

        <SheetSection className="h-full">
          <Form_Shadcn_ {...form}>
            <form
              id={FORM_ID}
              className="flex flex-col gap-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
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
            </form>
          </Form_Shadcn_>
        </SheetSection>

        <SheetFooter>
          <Button disabled={isUpdating} type="default" onClick={confirmOnClose}>
            Cancel
          </Button>
          <Button form={FORM_ID} htmlType="submit" disabled={!isValid} loading={isUpdating}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>

      <DiscardChangesConfirmationDialog {...modalProps} />
    </Sheet>
  )
}

import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from 'sonner'
import z from "zod";

import { Eye, EyeOff, X } from "lucide-react";
import { useParams } from 'common'
import {
  Button,
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
  cn
} from "ui";
import ConfirmationModal from "ui-patterns/Dialogs/ConfirmationModal";
import { FormItemLayout } from "ui-patterns/form/FormItemLayout/FormItemLayout";
import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import { ProjectSecret } from "data/secrets/secrets-query";

const FORM_ID = 'edit-secret-sidepanel'

const FormSchema = z.object({
  value: z.string().min(1, 'Please provide a value for your secret'),
});

type FormSchemaType = z.infer<typeof FormSchema>;

interface EditSecretModalProps {
  secret?: ProjectSecret
  visible: boolean
  onClose: () => void
}

export function EditSecretModal({ secret, visible, onClose }: EditSecretModalProps) {
  const { ref: projectRef } = useParams()

  const [isClosingPanel, setIsClosingPanel] = useState(false)
  const [focusedEditor, setFocusedEditor] = useState(false)
  const [showSecretValue, setShowSecretValue] = useState(false)

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema)
  })

  const { mutate: updateSecret, isLoading: isUpdating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated secret "${variables.secrets[0].name}"`)
      onClose()
    },
  })

  function isClosingSidePanel() {
    form.formState.isDirty ? setIsClosingPanel(true) : onClose()
  }
  const onSubmit: SubmitHandler<FormSchemaType> = async (data) => {
    if (secret === undefined) {
      return;
    }

    updateSecret({
      projectRef, secrets: [
        { name: secret?.name, value: data.value }
      ]
    })
  }

  useEffect(() => {
    if (visible) {
      setFocusedEditor(false)
      form.reset({ value: '' })
    }
  }, [visible, secret])

  return (
    <Sheet open={visible} onOpenChange={() => isClosingSidePanel()}>
      <SheetContent
        showClose={false}
        size={'default'}
        className={'p-0 flex flex-row gap-0 !min-w-screen lg:!min-w-[600px]'}
      >
        <div className="flex flex-col grow w-full">
          <SheetHeader className="py-3 flex flex-row justify-between items-center border-b-0">
            <div className="flex flex-row gap-3 items-center max-w-[75%]">
              <SheetClose
                className={cn(
                  'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'disabled:pointer-events-none data-[state=open]:bg-secondary',
                  'transition'
                )}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </SheetClose>
              <SheetTitle className="truncate">
                Edit secret
              </SheetTitle>
            </div>
          </SheetHeader>
          <Separator />
          <Form_Shadcn_ {...form}>
            <form
              id={FORM_ID}
              className="flex-grow overflow-auto"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <SheetSection className={focusedEditor ? 'hidden' : ''}>
                <FormField_Shadcn_
                  name="name"
                  defaultValue={secret?.name}
                  disabled
                  render={({ field }) => (
                    <FormItemLayout
                      label="Key"
                      layout="horizontal"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          className="!text-foreground-light"
                          placeholder="e.g. CLIENT_KEY"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              <SheetSection className={focusedEditor ? 'hidden' : 'space-y-4'}>
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
                          placeholder="my-secret-password"
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
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
            </form>
          </Form_Shadcn_>
          <SheetFooter>
            <Button disabled={false} type="default" onClick={isClosingSidePanel}>
              Cancel
            </Button>
            <Button
              form={FORM_ID}
              htmlType="submit"
              disabled={false}
              loading={false}
            >
              Save
            </Button>
          </SheetFooter>
        </div>
        <ConfirmationModal
          visible={isClosingPanel}
          title="Discard changes"
          confirmLabel="Discard"
          onCancel={() => setIsClosingPanel(false)}
          onConfirm={() => {
            setIsClosingPanel(false)
            onClose()
          }}
        >
          <p className="text-sm text-foreground-light">
            There are unsaved changes. Are you sure you want to close the panel? Your changes will
            be lost.
          </p>
        </ConfirmationModal>
      </SheetContent>
    </Sheet>
  )
}


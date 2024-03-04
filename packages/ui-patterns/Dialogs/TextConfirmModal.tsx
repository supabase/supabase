'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ReactNode, forwardRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DialogContent_Shadcn_,
  DialogTitle_Shadcn_,
  Dialog_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  IconAlertCircle,
  Input_Shadcn_,
} from 'ui'
import { z } from 'zod'

export interface TextConfirmModalProps {
  loading: boolean
  visible: boolean
  title: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
  cancelLabel?: string
  confirmLabel?: string
  confirmPlaceholder: string
  confirmString: string
  // alert?: string
  text?: string | ReactNode
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'warning' | 'destructive'
  alert?: {
    base: React.ComponentProps<typeof Alert_Shadcn_>
    title: React.ComponentProps<typeof AlertTitle_Shadcn_>
    description: React.ComponentProps<typeof AlertDescription_Shadcn_>
  }
  blockDeleteButton?: boolean
}

const TextConfirmModal = forwardRef<
  React.ElementRef<typeof DialogContent_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof Dialog_Shadcn_> & TextConfirmModalProps
>(
  (
    {
      title,
      size = 'small',
      onConfirm,
      visible,
      onCancel,
      loading,
      cancelLabel = 'Cancel',
      confirmLabel = 'Submit',
      confirmPlaceholder,
      confirmString,
      alert,
      text,
      children,
      blockDeleteButton = true,
      variant,
      ...props
    },
    ref
  ) => {
    // Your component logic here

    // [Joshen] Have to keep the loading prop here as this component itself doesn't
    // directly trigger any potential async job that follows onConfirm. It only triggers
    // the onConfirm callback function, and hence if anything fails in the callback,
    // have to depend on loading prop to unfreeze the UI state

    // const validate = (values: any) => {
    //   const errors: any = {}
    //   if (values.confirmValue.length === 0) {
    //     errors.confirmValue = 'Enter the required value.'
    //   } else if (values.confirmValue !== confirmString) {
    //     errors.confirmValue = 'Value entered does not match.'
    //   }
    //   return errors
    // }

    const formSchema = z.object({
      username: z.string().min(2, {
        message: 'Username must be at least 2 characters.',
      }),
    })

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        username: '',
      },
    })

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
      // Do something with the form values.
      // ✅ This will be type-safe and validated.
      console.log(values)
    }

    return (
      // <span>hello world</span>

      <Dialog_Shadcn_
        open={visible}
        // hideFooter
        // closable
        // size={size}
        // visible={visible}
        // header={title}
        // onCancel={onCancel}
        onOpenChange={() => {
          if (visible) {
            onCancel()
          }
        }}
      >
        <DialogContent_Shadcn_ ref={ref} className="p-0 gap-0">
          <DialogTitle_Shadcn_ className="border-b px-5 py-4">{title}</DialogTitle_Shadcn_>
          {alert && (
            <Alert_Shadcn_
              className="border-r-0 border-l-0 rounded-none -mt-px"
              {...alert?.base}
              variant={variant}
            >
              <IconAlertCircle strokeWidth={2} className="ml-0.5" />
              <AlertTitle_Shadcn_ {...alert?.title} />
              <AlertDescription_Shadcn_ {...alert?.description} />
            </Alert_Shadcn_>
          )}
          {children && <div className="p-5">{children}</div>}
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-5 py-3">
              <FormField_Shadcn_
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_>
                      Type <span className="text-foreground break-all">{confirmString}</span> to
                      confirm.
                    </FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ placeholder={confirmPlaceholder} {...field} />
                    </FormControl_Shadcn_>
                    <FormDescription_Shadcn_>
                      This is your public display name.
                    </FormDescription_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              <div className="flex justify-end gap-2">
                {!blockDeleteButton && (
                  <Button size="medium" block type="default" disabled={loading}>
                    {cancelLabel}
                  </Button>
                )}
                <Button
                  size="medium"
                  type={
                    variant === 'destructive'
                      ? 'danger'
                      : variant === 'warning'
                        ? 'warning'
                        : 'primary'
                  }
                  htmlType="submit"
                  block
                  loading={loading}
                  disabled={loading}
                >
                  {confirmLabel}
                </Button>
              </div>

              {/* <Form
        validateOnBlur
        initialValues={{ confirmValue: '' }}
        validate={validate}
        onSubmit={onConfirm}
      >
        {() => (
          <div className="w-full py-4">
            <div className="space-y-4">
              {children && (
                <>
                  <Modal.Content>{children}</Modal.Content>
                  <Modal.Separator />
                </>
              )}
              {alert && (
                <Modal.Content>
                  <Alert variant="warning" withIcon title={alert} />
                </Modal.Content>
              )}
              {text !== undefined && (
                <Modal.Content>
                  <p className="mb-2 block text-sm break-all">{text}</p>
                </Modal.Content>
              )}
              <Modal.Separator />
              <Modal.Content>
                <Input
                  id="confirmValue"
                  label={
                    <span>
                      Type <span className="text-foreground break-all">{confirmString}</span> to
                      confirm.
                    </span>
                  }
                  placeholder={confirmPlaceholder}
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Button
                  block
                  type="danger"
                  size="medium"
                  htmlType="submit"
                  loading={loading}
                  disabled={loading}
                >
                  {confirmLabel}
                </Button>
              </Modal.Content>
            </div>
          </div>
        )}
      </Form> */}
            </form>
          </Form_Shadcn_>
        </DialogContent_Shadcn_>
      </Dialog_Shadcn_>
    )
  }
)

TextConfirmModal.displayName = 'TextConfirmModal'

export default TextConfirmModal

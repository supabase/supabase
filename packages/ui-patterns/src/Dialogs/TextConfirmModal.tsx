'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy } from 'lucide-react'
import { forwardRef, ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert_Shadcn_,
  Button,
  cn,
  copyToClipboard,
  Dialog,
  DialogContent,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { DialogHeader } from 'ui/src/components/shadcn/ui/dialog'
import { z } from 'zod'

import { Admonition } from './../admonition'

export interface TextConfirmModalProps {
  loading: boolean
  visible: boolean
  title: string
  size?: React.ComponentProps<typeof DialogContent>['size']
  cancelLabel?: string
  confirmLabel?: string
  confirmPlaceholder: string
  confirmString: string
  text?: string | ReactNode
  onConfirm: () => void
  onCancel: () => void
  variant?: React.ComponentProps<typeof Alert_Shadcn_>['variant']
  alert?: {
    base?: React.ComponentProps<typeof Alert_Shadcn_>
    title?: string
    description?: string | ReactNode
  }
  input?: React.ComponentProps<typeof Input_Shadcn_>
  label?: React.ComponentProps<typeof FormLabel_Shadcn_>
  formMessage?: React.ComponentProps<typeof FormMessage_Shadcn_>
  description?: React.ComponentProps<typeof FormDescription_Shadcn_>
  blockDeleteButton?: boolean
  errorMessage?: string
  enableCopy?: boolean
}

export const TextConfirmModal = forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof Dialog> & TextConfirmModalProps
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
      input,
      label,
      description,
      formMessage,
      text,
      children,
      blockDeleteButton = true,
      variant = 'default',
      errorMessage = 'Value entered does not match',
      enableCopy = false,
      ...props
    },
    ref
  ) => {
    const [showCopied, setShowCopied] = useState(false)

    const formSchema = z.object({
      confirmValue: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : val),
        z.literal(confirmString.trim(), {
          errorMap: () => ({ message: errorMessage }),
        })
      ),
    })

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      reValidateMode: 'onChange',
      defaultValues: {
        confirmValue: '',
      },
    })

    const isFormValid = form.formState.isValid

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
      // Do something with the form values.
      // ✅ This will be type-safe and validated.
      onConfirm()
    }

    useEffect(() => {
      if (confirmString) form.reset()
    }, [confirmString])

    useEffect(() => {
      if (!showCopied) return
      const timer = setTimeout(() => setShowCopied(false), 2000)
      return () => clearTimeout(timer)
    }, [showCopied])

    return (
      <Dialog
        open={visible}
        {...props}
        onOpenChange={() => {
          if (visible) {
            onCancel()
          }
        }}
      >
        <DialogContent ref={ref} className="p-0 gap-0 pb-5 !block" size={size}>
          <DialogHeader className={cn('border-b')} padding={'small'}>
            <DialogTitle className="">{title}</DialogTitle>
          </DialogHeader>
          {alert && (
            <Admonition
              type={variant as 'default' | 'destructive' | 'warning'}
              label={alert.title}
              description={alert.description}
              className="border-x-0 rounded-none -mt-px"
              {...alert?.base}
            />
          )}
          {children && (
            <>
              <DialogSection padding={'small'}>{children}</DialogSection>
              <DialogSectionSeparator />
            </>
          )}
          {/* // older prop from before refactor */}
          {text !== undefined && (
            <>
              <DialogSection className="p-5" padding={'small'}>
                <p className="text-foreground-light text-sm">{text}</p>
              </DialogSection>
              <DialogSectionSeparator />
            </>
          )}
          <Form_Shadcn_ {...form}>
            <form
              autoComplete="off"
              onSubmit={form.handleSubmit(onSubmit)}
              className="px-5 flex flex-col gap-y-3 pt-3"
            >
              <FormField_Shadcn_
                control={form.control}
                name="confirmValue"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                    <FormLabel_Shadcn_ {...label} enableSelection={!enableCopy}>
                      Type{' '}
                      {enableCopy ? (
                        <Button
                          type="default"
                          className="h-[23px] px-1.5 py-0 border-muted text-sm whitespace-pre break-all"
                          iconRight={
                            showCopied ? <Check strokeWidth={2} className="text-brand" /> : <Copy />
                          }
                          onClick={() => {
                            setShowCopied(true)
                            copyToClipboard(confirmString)
                          }}
                        >
                          {confirmString}
                        </Button>
                      ) : (
                        <span className="text-foreground break-all whitespace-pre">
                          {confirmString}
                        </span>
                      )}{' '}
                      to confirm.
                    </FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        autoComplete="off"
                        placeholder={confirmPlaceholder}
                        {...input}
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    {!!description && <FormDescription_Shadcn_ {...description} />}
                    <FormMessage_Shadcn_ {...formMessage} />
                  </FormItem_Shadcn_>
                )}
              />
              <div className="flex gap-2">
                {!blockDeleteButton && (
                  <Button size="medium" block type="default" disabled={loading} onClick={onCancel}>
                    {cancelLabel}
                  </Button>
                )}
                <Button
                  block
                  size="medium"
                  type={
                    variant === 'destructive'
                      ? 'danger'
                      : variant === 'warning'
                        ? 'warning'
                        : 'primary'
                  }
                  htmlType="submit"
                  loading={loading}
                  disabled={!isFormValid || loading}
                  className="truncate"
                >
                  {confirmLabel}
                </Button>
              </div>
            </form>
          </Form_Shadcn_>
        </DialogContent>
      </Dialog>
    )
  }
)

TextConfirmModal.displayName = 'TextConfirmModal'

export default TextConfirmModal

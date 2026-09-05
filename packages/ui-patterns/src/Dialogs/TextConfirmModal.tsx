'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy } from 'lucide-react'
// Required to avoid issue:
// The inferred type of ConfirmationModal cannot be named without a reference to DialogProps
import { Dialog as _RadixDialog } from 'radix-ui'
import { forwardRef, ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Button,
  cn,
  copyToClipboard,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from 'ui'
import { z } from 'zod'

import { Admonition } from '../Admonition'
import {
  CONFIRM_ACTION_VERBS,
  getConfirmPlaceholderFromAction,
  getConfirmStringFromAction,
  type ConfirmAction,
} from './confirm-actions'

export type { ConfirmAction } from './confirm-actions'

type TextConfirmModalBaseProps = {
  loading: boolean
  visible: boolean
  title: string
  size?: React.ComponentProps<typeof DialogContent>['size']
  cancelLabel?: string
  confirmLabel?: string
  text?: string | ReactNode
  onConfirm: () => void
  onCancel: () => void
  variant?: React.ComponentProps<typeof Alert>['variant']
  alert?: {
    base?: React.ComponentProps<typeof Alert>
    title?: string
    description?: string | ReactNode
  }
  input?: React.ComponentProps<typeof Input>
  label?: React.ComponentProps<typeof FormLabel>
  formMessage?: React.ComponentProps<typeof FormMessage>
  description?: React.ComponentProps<typeof FormDescription>
  blockDeleteButton?: boolean
  errorMessage?: string
  enableCopy?: boolean
}

type TextConfirmModalPresetProps = TextConfirmModalBaseProps & {
  confirmAction: Exclude<ConfirmAction, 'custom'>
  confirmSubject?: string
  confirmString?: never
  confirmPlaceholder?: never
}

type TextConfirmModalCustomProps = TextConfirmModalBaseProps & {
  confirmAction?: 'custom'
  confirmSubject?: never
  confirmString: string
  confirmPlaceholder: string
}

export type TextConfirmModalProps = TextConfirmModalPresetProps | TextConfirmModalCustomProps

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
      confirmAction,
      confirmSubject,
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

    const resolvedConfirmString = getConfirmStringFromAction(confirmAction, confirmString)
    const resolvedConfirmPlaceholder = getConfirmPlaceholderFromAction(
      confirmAction,
      confirmPlaceholder
    )

    const formSchema = z.object({
      confirmValue: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : val),
        z.literal(resolvedConfirmString.trim(), {
          errorMap: () => ({ message: errorMessage }),
        })
      ),
    })

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      reValidateMode: 'onChange',
      defaultValues: {
        confirmValue: '',
      },
    })

    const isFormValid = form.formState.isValid

    function onSubmit(_values: z.infer<typeof formSchema>) {
      onConfirm()
    }

    useEffect(() => {
      if (resolvedConfirmString) form.reset()
    }, [resolvedConfirmString])

    useEffect(() => {
      if (!showCopied) return
      const timer = setTimeout(() => setShowCopied(false), 2000)
      return () => clearTimeout(timer)
    }, [showCopied])

    const { title: _alertBaseTitle, children: _alertBaseChildren, ...alertBase } = alert?.base ?? {}
    const alertTitleProps = alert?.title ? { title: alert.title } : {}

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
        <DialogContent ref={ref} className="p-0 gap-0 pb-5 block!" size={size}>
          <DialogHeader className={cn('border-b')} padding={'small'}>
            <DialogTitle className="">{title}</DialogTitle>
          </DialogHeader>
          {alert && (
            <Admonition
              type={variant as 'default' | 'destructive' | 'warning'}
              description={alert.description}
              {...alertTitleProps}
              className="border-x-0 rounded-none -mt-px"
              {...alertBase}
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
          <Form {...form}>
            <form
              autoComplete="off"
              onSubmit={form.handleSubmit(onSubmit)}
              className="px-5 flex flex-col gap-y-3 pt-3"
            >
              <FormField
                control={form.control}
                name="confirmValue"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-y-2">
                    <FormLabel {...label} enableSelection={!enableCopy}>
                      Type{' '}
                      {enableCopy ? (
                        <Button
                          variant="default"
                          className="h-[23px] px-1.5 py-0 border-muted text-sm font-medium text-foreground whitespace-pre break-all"
                          iconRight={
                            showCopied ? <Check strokeWidth={2} className="text-brand" /> : <Copy />
                          }
                          onClick={() => {
                            setShowCopied(true)
                            copyToClipboard(resolvedConfirmString)
                          }}
                        >
                          {resolvedConfirmString}
                        </Button>
                      ) : (
                        <span className="font-medium text-foreground break-all whitespace-pre">
                          {resolvedConfirmString}
                        </span>
                      )}{' '}
                      {confirmAction && confirmAction !== 'custom' && confirmSubject
                        ? `to ${CONFIRM_ACTION_VERBS[confirmAction]} ${confirmSubject}.`
                        : 'to confirm.'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        placeholder={resolvedConfirmPlaceholder}
                        {...input}
                        {...field}
                      />
                    </FormControl>
                    {!!description && <FormDescription {...description} />}
                    <FormMessage {...formMessage} />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                {!blockDeleteButton && (
                  <Button
                    size="medium"
                    block
                    variant="default"
                    disabled={loading}
                    onClick={onCancel}
                  >
                    {cancelLabel}
                  </Button>
                )}
                <Button
                  block
                  size="medium"
                  variant={
                    variant === 'destructive'
                      ? 'danger'
                      : variant === 'warning'
                        ? 'warning'
                        : 'primary'
                  }
                  type="submit"
                  loading={loading}
                  disabled={!isFormValid || loading}
                  className="truncate"
                >
                  {confirmLabel}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    )
  }
)

TextConfirmModal.displayName = 'TextConfirmModal'

export default TextConfirmModal

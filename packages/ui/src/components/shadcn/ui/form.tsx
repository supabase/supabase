'use client'

import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import { AnimatePresence, motion } from 'framer-motion'
import * as React from 'react'
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  useWatch,
} from 'react-hook-form'

import { cn } from '../../../lib/utils/cn'
import { Label } from './label'

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ asChild, ...props }, ref) => {
  const id = React.useId()

  const Comp = asChild ? Slot : 'div'

  return (
    <FormItemContext.Provider value={{ id }}>
      <Comp ref={ref} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = 'FormItem'

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { enableSelection?: boolean }
>(({ className, enableSelection = false, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  const Comp = enableSelection ? 'label' : Label

  return (
    <Comp
      ref={ref}
      className={cn(
        'text-foreground-light text-sm',
        'transition-colors',
        error && '!text-destructive',
        className,
        'leading-normal'
      )}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = 'FormLabel'

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <div
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-foreground-light', className)}
      {...props}
    />
  )
})
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  return (
    <AnimatePresence initial={false}>
      {body ? ( // Only animate if there is a message body
        <motion.div
          key={formMessageId} // Use a unique key to help with animations
          initial={{ opacity: 0, y: -5, height: 0 }} // Start slightly hidden
          animate={{ opacity: 1, y: 0, height: 'auto' }} // Fade in and slide up
          exit={{ opacity: 0, y: -5, height: 0 }} // Fade out and slide back up
          transition={{ duration: 0.15, ease: 'easeInOut' }} // Smooth transition
        >
          <p
            ref={ref}
            id={formMessageId}
            className={cn('text-sm text-destructive', className)}
            {...props}
          >
            {body}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
})

FormMessage.displayName = 'FormMessage'

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
  useWatch,
}

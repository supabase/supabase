import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'
import { Button } from '../../Button'
import { Input, type InputProps } from './input'
import { Textarea, type TextareaProps } from './textarea'

interface InputGroupProps extends React.ComponentProps<'div'> {
  /**
   * This props is passed in by <FormControl> but they should be applied on the input itself. When using
   * <InputGroup> inside a <Form>, use <FormInputGroupInput> and <FormInputGroupTextArea> instead of the
   * regular <Input> and <Textarea> components.
   */
  id?: string
  /**
   * This props is passed in by <FormControl> but they should be applied on the input itself. When using
   * <InputGroup> inside a <Form>, use <FormInputGroupInput> and <FormInputGroupTextArea> instead of the
   * regular <Input> and <Textarea> components.
   */
  'aria-invalid'?: React.AriaAttributes['aria-invalid']
  /**
   * This props is passed in by <FormControl> but they should be applied on the input itself. When using
   * <InputGroup> inside a <Form>, use <FormInputGroupInput> and <FormInputGroupTextArea> instead of the
   * regular <Input> and <Textarea> components.
   */
  'aria-describedby'?: string
}

/*
 * Used to group input elements together with addons like labels, buttons, or text. When using this component
 * inside a <Form>, use FormInputGroupInput and FormInputGroupTextArea instead of the regular Input
 * and Textarea components to ensure proper form field association and accessibility.
 */
function InputGroup({
  className,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  ...props
}: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        'group/input-group relative items-center outline-hidden transition-[color,box-shadow]',
        'flex rounded-md border border-control bg-foreground/[.026] text-sm',
        'has-[>textarea]:h-auto',

        // Variants based on alignment.
        'has-[>[data-align=inline-start]]:[&>input]:pl-2',
        'has-[>[data-align=inline-end]]:[&>input]:pr-2',
        'has-[>[data-align=block-end]]:pb-0',
        'has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3',
        'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3',

        // Focus state.
        'has-[[data-slot=input-group-control]:focus-visible]:outline-hidden has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-background-control has-[[data-slot=input-group-control]:focus-visible]:ring-offset-2 has-[[data-slot=input-group-control]:focus-visible]:ring-offset-foreground-muted',

        // Error state.
        'has-[[data-slot][aria-invalid=true]]:bg-destructive-200 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive-400 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',
        'has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]:focus-visible]:border-destructive',

        // Disabled state.
        'has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:text-foreground-muted',

        // Readonly state.
        'has-[[data-slot=input-group-control]:read-only]:border-button',
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "text-foreground-light flex h-auto cursor-text select-none items-center justify-center gap-2 text-sm group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        'inline-start': 'order-first pl-2 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]',
        'inline-end': 'order-last pr-2 has-[>button]:mr-[-0.4rem] has-[>kbd]:mr-[-0.35rem]',
        'block-start':
          '[.border-b]:pb-3 order-first w-full justify-start px-2 pt-2 group-has-[>input]/input-group:pt-2.5',
        'block-end':
          '[.border-t]:pt-3 order-last w-full justify-start px-2 pb-2 group-has-[>input]/input-group:pb-2.5',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  }
)

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return
        }
        e.currentTarget.parentElement?.querySelector('input')?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva('', {
  variants: {
    size: {
      tiny: "h-6 gap-1 rounded-md px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
      small: 'h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5',
    },
  },
  defaultVariants: {
    size: 'tiny',
  },
})

function InputGroupButton({
  className,
  type = 'text',
  size = 'tiny',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      size={size}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        className
      )}
      {...props}
    />
  )
}

/*
 * If you need to use this component inside a <Form>, use FormInputGroupInput instead.
 */
function InputGroupInput({ className, ...props }: InputProps) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'flex-1 rounded-none border border-transparent -m-px bg-transparent shadow-none',
        'focus:border-transparent focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
        'read-only:border-transparent',
        'aria-invalid:border-transparent aria-invalid:bg-transparent',
        'aria-invalid:focus:border-transparent aria-invalid:focus-visible:border-transparent',
        className
      )}
      {...props}
    />
  )
}

/*
 * If you need to use this component inside a <Form>, use FormInputGroupTextArea instead.
 */
function InputGroupTextarea({ className, ...props }: TextareaProps) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        'flex-1 resize-none rounded-none border border-transparent bg-transparent py-0 shadow-none',
        'focus:border-transparent focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}

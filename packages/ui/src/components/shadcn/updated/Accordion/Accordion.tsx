import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { cn } from './../../lib/utils'

import { VariantProps, cva, cx } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import React, { createContext, useContext, useState } from 'react'

export type AccordionRootVariantsProps = VariantProps<typeof accordionRootVariants>
const accordionRootVariants = cva('flex flex-col', {
  variants: {
    type: {
      default: 'space-y-3',
      bordered: '-space-y-px',
    },
    defaultVariants: {
      type: 'default',
    },
  },
})

export type AccordionItemVariantsProps = VariantProps<typeof accordionItemVariants>
const accordionItemVariants = cva(
  'group first:rounded-tl-md first:rounded-tr-md last:rounded-bl-md last:rounded-br-md',
  {
    variants: {
      type: {
        default: 'overflow-hidden',
        bordered: 'border border-scale-700',
      },
      justified: {
        true: 'justify-between',
        false: '',
      },
    },
  }
)

const accordionTriggerVariants = cva(
  `flex flex-row items-center w-full text-left cursor-pointer focus-visible:ring-1 focus-visible:z-10 ring-scale-1100
    justify-between transition-all hover:underline [&[data-state=open]>svg]:rotate-180`,
  {
    variants: {
      type: {
        default: 'gap-3',
        bordered: `
          px-6 py-4
          font-medium text-base bg-transparent 
          transition-colors hover:bg-scale-200 
          overflow-hidden 
          group-first:rounded-tl-md group-first:rounded-tr-md 
          group-last:rounded-bl-md group-last:rounded-br-md`,
      },
    },
  }
)

const accordionContentVariants = cva('pb-4 pt-0', {
  variants: {
    type: {
      default: '',
      bordered: 'px-6',
    },
  },
})

type Type = AccordionRootVariantsProps['type']
type Align = 'left' | 'right' | undefined

interface ContextValue {
  chevronAlign: Align
  justified: boolean
  type: Type
  defaultValue: AccordionPrimitive.AccordionImplSingleProps['defaultValue']
}

interface AdditionalProps {
  openBehaviour: 'single' | 'multiple'
  variant?: Type
  // Add other additional props here
  onChange?: (item: string | string[]) => void
  type?: Type
  justified?: AccordionItemVariantsProps['justified']
  chevronAlign?: Align
}

interface AccordionComponent
  extends React.ForwardRefExoticComponent<
    ExtendedAccordionProps & React.RefAttributes<HTMLDivElement>
  > {
  Item: typeof AccordionItem
  Content: typeof AccordionContent
  Trigger: typeof AccordionTrigger
}

export interface AccordionSingleProps extends AccordionPrimitive.AccordionImplSingleProps {
  openBehaviour: 'single'
  value?: string
  // Add other props specific to single accordion
}

export interface AccordionMultipleProps extends AccordionPrimitive.AccordionImplMultipleProps {
  openBehaviour: 'multiple'
  value?: string[]
  // Add other props specific to multiple accordion
}

type ExtendedAccordionProps = (AccordionSingleProps | AccordionMultipleProps) & AdditionalProps

const AccordionContext = createContext<ContextValue>({
  chevronAlign: 'left',
  justified: false, // Set the default value to false
  type: undefined,
  defaultValue: undefined,
})

const Accordion: AccordionComponent = React.forwardRef(
  ({ openBehaviour, type, chevronAlign, justified, defaultValue, ...props }, ref) => {
    function handleOnChange(e: string | string[]) {
      if (props.onChange) props.onChange(e)
    }

    const contextValue = {
      chevronAlign,
      justified: justified || false, // Provide a default value of false
      type: type || 'default', // Provide a default value for the type
      defaultValue: Array.isArray(defaultValue) ? defaultValue.join('') : defaultValue, // Convert array to string
    }

    if (openBehaviour === 'single') {
      const { value, children, className, ...singleProps } = props as AccordionSingleProps
      return (
        <AccordionPrimitive.Root
          ref={ref}
          type="single"
          onValueChange={handleOnChange}
          value={value}
          defaultValue={defaultValue}
          className={cn(accordionRootVariants({ type }), className)}
          children={
            <AccordionContext.Provider value={{ ...contextValue }}>
              {children}
            </AccordionContext.Provider>
          }
          {...singleProps}
        />
      )
    } else {
      const { value, children, className, ...multipleProps } = props as AccordionMultipleProps
      return (
        <AccordionPrimitive.Root
          ref={ref}
          type="multiple"
          onValueChange={handleOnChange}
          value={value}
          className={cn(accordionRootVariants({ type }), className)}
          children={
            <AccordionContext.Provider value={{ ...contextValue }}>
              <div>{props.children}</div>
            </AccordionContext.Provider>
          }
          {...multipleProps}
        />
      )
    }
  }
) as AccordionComponent

export interface ItemAdditionalProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {}

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => {
  const [open, setOpen] = useState(false)

  let { type, justified } = useContext(AccordionContext)

  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(accordionItemVariants({ type, justified }), className)}
      onClick={() => {
        setOpen(!open)
      }}
      {...props}
    />
  )
})
AccordionItem.displayName = AccordionPrimitive.Item.displayName

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const { type } = useContext(AccordionContext)
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(accordionTriggerVariants({ type }), className)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { type } = useContext(AccordionContext)
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className
      )}
      {...props}
    >
      <div className={cx(accordionContentVariants({ type }))}>{children}</div>
    </AccordionPrimitive.Content>
  )
})
AccordionContent.displayName = AccordionPrimitive.Content.displayName

Accordion.Item = AccordionItem
Accordion.Content = AccordionContent
Accordion.Trigger = AccordionTrigger
export { Accordion }

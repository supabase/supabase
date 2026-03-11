import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'
import React from 'react'
import {
  cn,
  FormDescription_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Label_Shadcn_,
} from 'ui'
import { SIZE } from 'ui/src/lib/constants'

type Props = {
  align?: 'left' | 'right'
  description?: string | React.ReactNode
  error?: string | React.ReactNode
  label?: string | React.ReactNode
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical' | 'flex' | 'flex-row-reverse'
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  beforeLabel?: string | React.ReactNode
  afterLabel?: string | React.ReactNode
  nonBoxInput?: boolean
  labelLayout?: 'horizontal' | 'vertical'
  isReactForm?: boolean
  hideMessage?: boolean
  name?: string
}

const ContainerVariants = cva('relative grid gap-10', {
  variants: {
    size: {
      tiny: 'text-xs',
      small: 'text-sm leading-4',
      medium: 'text-sm',
      large: 'text-base',
      xlarge: 'text-base',
    },
    align: { left: '', right: '' },
    responsive: {
      true: '',
      false: '',
    },
    layout: {
      horizontal: 'flex flex-col gap-2 md:grid md:grid-cols-12',
      vertical: 'flex flex-col gap-2',
      flex: 'flex flex-row gap-3',
      'flex-row-reverse':
        'flex flex-col-reverse gap-2 md:gap-6 md:flex-row-reverse md:justify-between',
    },
    flex: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      layout: 'flex',
      align: 'right',
      className: 'justify-between',
    },
    {
      layout: 'flex-row-reverse',
      align: 'right',
      className: 'justify-between',
    },
  ],
  defaultVariants: {},
})

const LabelContainerVariants = cva('transition-all duration-500 ease-in-out', {
  variants: {
    flex: {
      true: '',
      false: '',
    },
    align: {
      left: '',
      right: '',
    },
    layout: {
      horizontal: 'flex flex-col gap-2 col-span-4',
      vertical: 'flex flex-row gap-2 justify-between',
      flex: 'flex flex-col gap-0 min-w-0',
      'flex-row-reverse': 'flex flex-col min-w-0 flex-grow',
    },
    labelLayout: {
      horizontal: '',
      vertical: '',
      '': '',
    },
  },
  compoundVariants: [
    {
      flex: true,
      align: 'left',
      className: 'order-2',
    },
    {
      flex: true,
      align: 'right',
      className: 'order-1',
    },
    {
      layout: ['vertical', 'flex'],
      labelLayout: undefined,
      flex: false,
      className: 'flex flex-row gap-2 justify-between',
    },
    {
      layout: 'horizontal',
      className: 'flex flex-col gap-2',
    },
  ],
  defaultVariants: {},
})

const DataContainerVariants = cva('transition-all duration-500 ease-in-out', {
  variants: {
    flex: {
      true: '',
      false: '',
    },
    align: {
      left: 'order-1',
      right: 'order-2',
    },
    layout: {
      horizontal: '',
      vertical: '',
      flex: '',
      'flex-row-reverse': '',
    },
  },
  compoundVariants: [
    {
      flex: true,
      align: 'left',
      className: 'order-1',
    },
    {
      flex: true,
      align: 'right',
      className: 'order-2',
    },
    {
      layout: ['vertical', 'flex'],
      className: 'col-span-12',
    },
    {
      layout: 'horizontal',
      align: 'left',
      className: 'col-span-8',
    },
    {
      layout: 'horizontal',
      align: 'right',
      className: 'text-right',
    },
  ],
  defaultVariants: {},
})

const DescriptionVariants = cva('text-foreground-lighter leading-normal', {
  variants: {
    size: {
      ...SIZE.text,
    },
    layout: {
      vertical: 'mt-2',
      horizontal: 'mt-2',
      flex: '',
      'flex-row-reverse': '',
    },
  },
  defaultVariants: {},
})

const LabelBeforeVariants = cva('text-foreground-muted', {
  variants: {
    size: {
      ...SIZE.text,
    },
  },
  defaultVariants: {},
})

const LabelAfterVariants = cva('text-foreground-muted', {
  variants: {
    size: {
      ...SIZE.text,
    },
  },
  defaultVariants: {},
})

const LabelOptionalVariants = cva('text-foreground-muted', {
  variants: {
    size: {
      ...SIZE.text,
    },
  },
  defaultVariants: {},
})

const FlexContainer = cva('', {
  variants: {
    flex: {
      true: '',
      false: '',
    },
    align: {
      left: '',
      right: '',
    },
    layout: {
      horizontal: '',
      vertical: '',
      flex: '',
      'flex-row-reverse': '',
    },
  },
  compoundVariants: [
    {
      flex: true,
      align: 'left',
      className: '',
    },
    {
      flex: true,
      align: 'right',
      className: 'order-last',
    },
    {
      layout: 'flex-row-reverse',
      className:
        'flex flex-col justify-center items-start md:items-end shrink-0 md:w-1/2 xl:w-2/5 md:min-w-100 [&>div]:md:w-full',
    },
  ],
})

const NonBoxInputContainer = cva('', {
  variants: {
    nonBoxInput: {
      true: '',
      false: '',
    },
    label: {
      true: '',
      false: '',
    },
    layout: {
      vertical: '',
      horizontal: '',
      'flex-row-reverse': '',
    },
  },
  compoundVariants: [
    {
      nonBoxInput: true,
      label: true,
      layout: 'vertical',
      className: 'my-3',
    },
    {
      nonBoxInput: true,
      label: true,
      layout: 'horizontal',
      className: 'my-3 md:mt-0 mb-3',
    },
  ],
  defaultVariants: {},
})

export const FormLayout = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & Props
>(
  (
    {
      align = 'left',
      className,
      description,
      id,
      label,
      labelOptional,
      layout = 'vertical',
      style,
      labelLayout,
      size = 'medium',
      beforeLabel,
      afterLabel,
      nonBoxInput = !label,
      hideMessage = false,
      isReactForm,
      ...props
    },
    ref
  ) => {
    const flex = layout === 'flex' || layout === 'flex-row-reverse'
    const hasLabel = Boolean(label || beforeLabel || afterLabel)
    const renderError =
      isReactForm && !hideMessage ? (
        <FormMessage_Shadcn_
          className={cn(
            'mt-2 transition-all duration-300 ease-in-out',
            layout === 'flex-row-reverse' && 'mt-0'
          )}
          data-formlayout-id="message"
        />
      ) : null

    const renderDescription =
      description && isReactForm ? (
        <FormDescription_Shadcn_
          className={cn(DescriptionVariants({ size, layout }))}
          data-formlayout-id={'description'}
          id={`${id}-description`}
        >
          {description}
        </FormDescription_Shadcn_>
      ) : description ? (
        <p
          className={cn(DescriptionVariants({ size, layout }), 'text-sm text-foreground-light')}
          data-formlayout-id={'description'}
        >
          {description}
        </p>
      ) : null

    const LabelContents = () => (
      <>
        {beforeLabel && (
          <span
            className={cn(LabelBeforeVariants({ size }))}
            id={id + '-before'}
            data-formlayout-id={'beforeLabel'}
          >
            <span>{beforeLabel}</span>
          </span>
        )}
        <span>{label}</span>
        {afterLabel && (
          <span
            className={cn(LabelAfterVariants({ size }))}
            id={id + '-after'}
            data-formlayout-id={'afterLabel'}
          >
            {afterLabel}
          </span>
        )}
      </>
    )

    return (
      <div
        ref={ref}
        {...props}
        className={cn(ContainerVariants({ size, flex, align, layout }), className)}
      >
        {flex && (
          <div className={cn(FlexContainer({ flex, align, layout }))}>
            {props.children}
            {layout === 'flex-row-reverse' && renderError}
          </div>
        )}
        {hasLabel || labelOptional || layout === 'horizontal' ? (
          <>
            <div
              className={cn(LabelContainerVariants({ align, labelLayout, flex, layout }))}
              data-formlayout-id={'labelContainer'}
            >
              {hasLabel && isReactForm ? (
                <FormLabel_Shadcn_
                  className="text-foreground flex gap-2 items-center break-all"
                  data-formlayout-id="formLabel"
                  htmlFor={props.name || id}
                >
                  <LabelContents />
                </FormLabel_Shadcn_>
              ) : (
                <Label_Shadcn_
                  className="text-foreground flex gap-2 items-center break-all leading-normal"
                  data-formlayout-id="label"
                  htmlFor={props.name || id}
                >
                  <LabelContents />
                </Label_Shadcn_>
              )}
              {labelOptional && (
                <span
                  className={cn(LabelOptionalVariants({ size }))}
                  id={id + '-optional'}
                  data-formlayout-id={'labelOptional'}
                >
                  {labelOptional}
                </span>
              )}
              {flex && (
                <>
                  {renderDescription}
                  {layout !== 'flex-row-reverse' && renderError}
                </>
              )}
            </div>
          </>
        ) : null}
        {!flex && (
          <div
            className={cn(DataContainerVariants({ align, layout }))}
            style={style}
            data-formlayout-id={'dataContainer'}
          >
            <>
              <div
                className={cn(
                  NonBoxInputContainer({
                    nonBoxInput,
                    // @ts-expect-error
                    label,
                    layout,
                  })
                )}
                data-formlayout-id={'nonBoxInputContainer'}
              >
                {props.children}
              </div>
              {renderError}
              {renderDescription}
            </>
          </div>
        )}
      </div>
    )
  }
)

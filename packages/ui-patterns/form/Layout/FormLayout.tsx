import { cva } from 'class-variance-authority'
import React from 'react'
import {
  FormDescription_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Label_Shadcn_,
  cn,
} from 'ui'
import { SIZE } from 'ui/src/lib/constants'

type Props = {
  align?: 'left' | 'right'
  description?: string | React.ReactNode
  error?: string | React.ReactNode
  label?: string | React.ReactNode
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical' | 'flex'
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  beforeLabel?: string | React.ReactNode
  afterLabel?: string | React.ReactNode
  nonBoxInput?: boolean
  labelLayout?: 'horizontal' | 'vertical'
  isReactForm?: boolean
  hideMessage?: boolean
  name?: string
}

const ContainerVariants = cva('grid gap-2', {
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
      horizontal: 'grid grid-cols-12',
      vertical: 'flex flex-col gap-3',
      flex: 'flex flex-row gap-3',
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
  ],
  defaultVariants: {},
})

const LabelContainerVariants = cva('', {
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
      flex: 'flex flex-col gap-0',
    },
    labelLayout: {
      horizontal: '',
      vertical: '',
      ['']: '',
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
      layout: 'vertical' || 'flex',
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

const DataContainerVariants = cva('', {
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
      layout: 'vertical' || 'flex',
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
      nonBoxInput = label ? false : true,
      hideMessage = false,
      isReactForm,
      ...props
    },
    ref
  ) => {
    const flex = layout === 'flex'
    const hasLabel = Boolean(label || beforeLabel || afterLabel)
    const renderError = isReactForm && !hideMessage && (
      <FormMessage_Shadcn_ className="mt-2" data-formlayout-id={'message'} />
    )

    const renderDescription =
      description && isReactForm ? (
        <FormDescription_Shadcn_
          className={cn(DescriptionVariants({ size, layout }))}
          data-formlayout-id={'description'}
          id={id + '-description'}
        >
          {description}
        </FormDescription_Shadcn_>
      ) : (
        <p
          className={cn(DescriptionVariants({ size, layout }), 'text-sm text-foreground-light')}
          data-formlayout-id={'description'}
        >
          {description}
        </p>
      )

    const LabelContents = () => (
      <>
        {beforeLabel && (
          <span
            className={cn(LabelBeforeVariants({ size }))}
            id={id + '-before'}
            data-formlayout-id={'beforeLabel'}
          >
            {beforeLabel}
          </span>
        )}
        {label}
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
        {flex && <div className={cn(FlexContainer({ flex, align }))}>{props.children}</div>}
        {hasLabel || labelOptional || layout === 'horizontal' ? (
          <>
            <div
              className={cn(LabelContainerVariants({ align, labelLayout, flex, layout }))}
              data-formlayout-id={'labelContainer'}
            >
              {hasLabel && isReactForm ? (
                <FormLabel_Shadcn_
                  className="flex gap-2 items-center"
                  data-formlayout-id={'formLabel'}
                >
                  <LabelContents />
                </FormLabel_Shadcn_>
              ) : (
                <Label_Shadcn_
                  htmlFor={props.name}
                  data-formlayout-id={'label'}
                  className="flex gap-2 items-center"
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
                  {renderError}
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

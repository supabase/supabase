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

export type FormLayoutProps = {
  description?: string | React.ReactNode | undefined
  label?: string | React.ReactNode
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical'
  isReactForm?: boolean
  hideMessage?: boolean
}

type Props = {
  align?: 'left' | 'right'
  descriptionText?: string | React.ReactNode
  error?: string | React.ReactNode
  label?: string | React.ReactNode
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical' | 'flex'
  // flex?: boolean
  responsive?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  beforeLabel?: string
  afterLabel?: string | React.ReactNode
  nonBoxInput?: boolean
  labelLayout?: 'horizontal' | 'vertical'
  isReactForm?: boolean
  name?: string
  hideMessage?: boolean
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
    flex: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      flex: true,
      align: 'left',
      className: 'flex flex-row gap-6',
    },
    {
      flex: true,
      align: 'right',
      className: 'flex flex-row gap-6 justify-between',
    },
    {
      flex: false,
      responsive: true,
      className: 'md:grid md:grid-cols-12',
    },
    {
      flex: false,
      responsive: false,
      className: 'grid grid-cols-12 gap-2',
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
      horizontal: '',
      vertical: '',
      flex: '',
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
      className: 'flex flex-row space-x-2 justify-between col-span-12',
    },
    {
      labelLayout: 'horizontal',
      className: 'flex flex-row space-x-2 justify-between col-span-12',
    },
    {
      labelLayout: 'vertical',
      className: 'flex flex-col space-y-2 col-span-4',
    },
    {
      layout: 'horizontal',
      labelLayout: undefined,
      className: 'flex flex-col space-y-2 col-span-4',
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

const DescriptionVariants = cva('mt-2 text-foreground-lighter leading-normal', {
  variants: {
    size: {
      ...SIZE.text,
    },
  },
  defaultVariants: {},
})

const LabelBeforeVariants = cva('text-foreground-lighter', {
  variants: {
    size: {
      ...SIZE.text,
    },
  },
  defaultVariants: {},
})

const LabelAfterVariants = cva('text-foreground-lighter', {
  variants: {
    size: {
      ...SIZE.text,
    },
  },
  defaultVariants: {},
})

const LabelOptionalVariants = cva('text-foreground-lighter', {
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
      descriptionText,
      id,
      label,
      labelOptional,
      layout = 'vertical',
      style,
      // flex = false,
      labelLayout,
      responsive = true,
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
    const renderError = isReactForm && !hideMessage && <FormMessage_Shadcn_ className="mt-2" />

    const renderDescription =
      descriptionText && isReactForm ? (
        <FormDescription_Shadcn_
          className={cn(DescriptionVariants({ size }))}
          id={id + '-description'}
        >
          {descriptionText}
        </FormDescription_Shadcn_>
      ) : (
        <p className={cn(DescriptionVariants({ size }), 'text-sm text-foreground-light')}>
          {descriptionText}
        </p>
      )

    const LabelContents = () => (
      <>
        {beforeLabel && (
          <span className={cn(LabelBeforeVariants({ size }))} id={id + '-before'}>
            {beforeLabel}
          </span>
        )}
        {label}
        {afterLabel && (
          <span className={cn(LabelAfterVariants({ size }))} id={id + '-after'}>
            {afterLabel}
          </span>
        )}
      </>
    )

    return (
      <div ref={ref} {...props} className={cn(ContainerVariants({ size, flex, align }), className)}>
        {flex && <div className={cn(FlexContainer({ flex, align }))}>{props.children}</div>}
        {hasLabel || labelOptional || layout === 'horizontal' ? (
          <div className={cn(LabelContainerVariants({ align, labelLayout, flex, layout }))}>
            {hasLabel && isReactForm ? (
              <FormLabel_Shadcn_>
                <LabelContents />
              </FormLabel_Shadcn_>
            ) : (
              <Label_Shadcn_ htmlFor={props.name}>
                <LabelContents />
              </Label_Shadcn_>
            )}
            {labelOptional && (
              <span className={cn(LabelOptionalVariants({ size }))} id={id + '-optional'}>
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
        ) : null}
        {!flex && (
          <div className={cn(DataContainerVariants({ align, layout }))} style={style}>
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

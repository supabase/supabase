'use client'

import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'class-variance-authority'
import { cloneElement, forwardRef, isValidElement } from 'react'
import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../lib/constants'
import { cn } from '../../lib/utils/cn'
import { IconContext } from '../Icon/IconContext'
import { IconLoader } from '../Icon/icons/IconLoader'
import { Loader } from 'lucide-react'

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
const buttonVariants = cva(
  `relative 
  flex items-center justify-center
  cursor-pointer 
  inline-flex 
  items-center 
  space-x-2 
  text-center 
  font-regular 
  ease-out 
  duration-200 
  rounded-md
  outline-none 
  transition-all 
  outline-0 
  focus-visible:outline-4 
  focus-visible:outline-offset-1
  border
  `,
  {
    variants: {
      type: {
        primary: `
            bg-brand-button hover:bg-brand-button/80
            text-white
            border-brand
            focus-visible:outline-brand-600
            shadow-sm
            data-[state=open]:bg-brand-button/80
            data-[state=open]:outline-brand-600
            `,
        secondary: `
            bg-foreground
            text-background hover:text-border-stronger
            focus-visible:text-border-control
            border-foreground-light hover:border-foreground-lighter
            focus-visible:outline-border-strong
            data-[state=open]:border-foreground-lighter
            data-[state=open]:outline-border-strong
            shadow-sm`,
        default: `
            text-foreground
            bg-button hover:bg-selection
            border-button hover:border-button-hover
            focus-visible:outline-brand-600
            data-[state=open]:bg-selection
            data-[state=open]:outline-brand-600
            data-[state=open]:border-button-hover
            shadow-sm`,
        alternative: `
            text-foreground
            bg-brand-400 hover:bg-brand-500
            border-brand-500
            focus-visible:border-brand-500
            focus-visible:outline-brand-600
            data-[state=open]:bg-brand-500
            data-[state=open]:border-brand-500
            data-[state=open]:outline-brand-600
            shadow-sm`,
        outline: `
            text-foreground
            bg-transparent
            border-strong hover:border-stronger
            focus-visible:outline-border-strong
            data-[state=open]:border-stronger
            data-[state=open]:outline-border-strong
            `,
        dashed: `
            text-foreground
            border
            border-dashed
            border-strong hover:border-stronger
            bg-transparent
            focus-visible:outline-border-strong
            data-[state=open]:border-stronger
            data-[state=open]:outline-border-strong
            shadow-sm`,
        link: `
            text-brand-600
            border
            border-transparent
            hover:bg-brand-400
            border-opacity-0
            bg-opacity-0
            shadow-none
            focus-visible:outline-border-strong
            data-[state=open]:bg-brand-400
            data-[state=open]:outline-border-strong
            `,
        text: `
            text-foreground
            hover:bg-surface-300
            shadow-none
            focus-visible:outline-border-strong
            data-[state=open]:bg-surface-300
            data-[state=open]:outline-border-strong
            border-transparent`,
        danger: `
            text-red-1100
            bg-red-200
            border-red-700 hover:border-red-900
            hover:bg-red-900
            hover:text-lo-contrast
            focus-visible:outline-red-700
            data-[state=open]:border-red-900
            data-[state=open]:bg-red-900
            data-[state=open]:text-lo-contrast
            data-[state=open]:outline-red-700
            shadow-sm`,
        warning: `
            text-amber-1100
            bg-amber-200
            border-amber-700 hover:border-amber-900
            hover:bg-amber-900
            hover:text-hi-contrast
            focus-visible:outline-amber-700
            data-[state=open]:border-amber-900
            data-[state=open]:bg-amber-900
            data-[state=open]:text-hi-contrast
            data-[state=open]:outline-amber-700
            shadow-sm`,
      },
      block: {
        true: 'w-full flex items-center justify-center',
      },
      size: {
        ...SIZE_VARIANTS,
      },
      overlay: {
        base: `absolute inset-0 bg-background opacity-50`,
        container: `fixed inset-0 transition-opacity`,
      },
      disabled: {
        true: 'opacity-50 cursor-default',
      },
      rounded: {
        true: 'rounded-full',
      },
      defaultVariants: {
        //   variant: 'default',
        //   size: 'default',
        size: {
          SIZE_VARIANTS_DEFAULT,
        },
      },
    },
  }
)

const IconContainerVariants = cva('', {
  variants: {
    size: {
      tiny: '[&_svg]:h-[14px] [&_svg]:w-[14px]',
      small: '[&_svg]:h-[18px] [&_svg]:w-[18px]',
      medium: '[&_svg]:h-[20px] [&_svg]:w-[20px]',
      large: '[&_svg]:h-[20px] [&_svg]:w-[20px]',
      xlarge: '[&_svg]:h-[24px] [&_svg]:w-[24px]',
      xxlarge: '[&_svg]:h-[30px] [&_svg]:w-[30px]',
      xxxlarge: '[&_svg]:h-[42px] [&_svg]:w-[42px]',
    },
  },
})

export type LoadingVariantProps = VariantProps<typeof loadingVariants>
const loadingVariants = cva('', {
  variants: {
    loading: {
      default: '',
      true: `animate-spin`,
    },
  },
})

export interface ButtonProps
  // omit `type` as we use it to change type of button
  // replaced with `htmlType`
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>,
    // omit 'disabled' as it is included in HTMLButtonElement
    Omit<ButtonVariantProps, 'disabled'>,
    LoadingVariantProps {
  asChild?: boolean
  type?: ButtonVariantProps['type']
  htmlType?: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
  icon?: React.ReactNode
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  rounded?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      size = 'tiny',
      type = 'primary',
      children,
      loading,
      block,
      icon,
      iconRight,
      iconLeft,
      htmlType = 'button',
      rounded,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const { className } = props
    const showIcon = loading || icon
    // decrecating 'showIcon' for rightIcon
    const _iconLeft: React.ReactNode = icon ?? iconLeft
    // if loading, button is disabled
    const disabled = loading === true || props.disabled

    return (
      <Comp
        ref={ref}
        data-size={size}
        type={htmlType}
        {...props}
        disabled={disabled}
        className={cn(buttonVariants({ type, size, disabled, block, rounded }), className)}
      >
        {asChild ? (
          isValidElement(children) ? (
            cloneElement(
              children,
              undefined,
              showIcon &&
                (loading ? (
                  <div className={cn(IconContainerVariants({ size }))}>
                    <Loader className={cn(loadingVariants({ loading }))} />
                  </div>
                ) : _iconLeft ? (
                  <div className={cn(IconContainerVariants({ size }))}>{_iconLeft}</div>
                ) : null),
              children.props.children && (
                <span className={'truncate'}>{children.props.children}</span>
              ),
              iconRight && !loading && (
                <div className={cn(IconContainerVariants({ size }))}>{iconRight}</div>
              )
            )
          ) : null
        ) : (
          <>
            {showIcon &&
              (loading ? (
                <div className={cn(IconContainerVariants({ size }))}>
                  <Loader className={cn(loadingVariants({ loading }))} />
                </div>
              ) : _iconLeft ? (
                <div className={cn(IconContainerVariants({ size }))}>{_iconLeft}</div>
              ) : null)}{' '}
            {children && <span className={'truncate'}>{children}</span>}{' '}
            {iconRight && !loading && (
              <IconContext.Provider value={{ contextSize: size }}>{iconRight}</IconContext.Provider>
            )}
          </>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }

'use client'

import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'class-variance-authority'
import { IconContext } from '@ui/components/Icon/IconContext'
import { IconLoader } from '@ui/components/Icon/icons/IconLoader'
import { sizes } from '@ui/lib/commonCva'
import { cn } from '@ui/lib/utils'
import { cloneElement, forwardRef, isValidElement } from 'react'

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
            shadow-sm`,
        secondary: `
            bg-foreground
            text-background hover:text-border-stronger
            focus-visible:text-border-control
            border-foreground-light hover:border-foreground-lighter
            focus-visible:outline-border-strong
            shadow-sm`,
        default: `
            text-foreground
            bg-button hover:bg-selection
            border-button hover:border-button-hover
            focus-visible:outline-brand-600
            shadow-sm`,
        alternative: `
            text-brand-600
            bg-brand-200 hover:bg-brand-400
            border-brand-600
            focus-visible:border-brand-300
            focus-visible:outline-brand-600
            shadow-sm`,
        outline: `
            text-foreground
            bg-transparent
            border-strong hover:border-stronger
            focus-visible:outline-border-strong`,
        dashed: `
            text-foreground
            border
            border-dashed
            border-strong hover:border-stronger
            bg-transparent
            focus-visible:outline-border-strong
            shadow-sm`,
        link: `
            text-brand-600
            border
            border-transparent
            hover:bg-brand-400
            border-opacity-0
            bg-opacity-0
            shadow-none
            focus-visible:outline-border-strong`,
        text: `
            text-foreground
            hover:bg-surface-300
            shadow-none
            focus-visible:outline-border-strong
            border-transparent`,
        danger: `
            text-red-1100
            bg-red-200
            border-red-700 hover:border-red-900
            hover:bg-red-900
            hover:text-lo-contrast
            focus-visible:outline-red-700
            shadow-sm`,
        warning: `
            text-amber-1100
            bg-amber-200
            border-amber-700 hover:border-amber-900
            hover:bg-amber-900
            hover:text-hi-contrast
            focus-visible:outline-amber-700
            shadow-sm`,
      },
      block: {
        true: 'w-full flex items-center justify-center',
      },
      size: {
        ...sizes,
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
      },
    },
  }
)

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
    const { className, disabled } = props
    const showIcon = loading || icon
    // decrecating 'showIcon' for rightIcon
    const _iconLeft: React.ReactNode = icon ?? iconLeft
    // if loading, button is disabled
    props.disabled = loading ? true : props.disabled

    return (
      <Comp
        ref={ref}
        type={htmlType}
        {...props}
        className={cn(buttonVariants({ type, size, disabled, block, rounded }), className)}
      >
        {asChild ? (
          isValidElement(children) ? (
            cloneElement(
              children,
              undefined,
              showIcon &&
                (loading ? (
                  <IconLoader size={size} className={cn(loadingVariants({ loading }))} />
                ) : _iconLeft ? (
                  <IconContext.Provider value={{ contextSize: size }}>
                    {_iconLeft}
                  </IconContext.Provider>
                ) : null),
              children.props.children && (
                <span className={'truncate'}>{children.props.children}</span>
              ),
              iconRight && !loading && (
                <IconContext.Provider value={{ contextSize: size }}>
                  {iconRight}
                </IconContext.Provider>
              )
            )
          ) : null
        ) : (
          <>
            {showIcon &&
              (loading ? (
                <IconLoader size={size} className={cn(loadingVariants({ loading }))} />
              ) : _iconLeft ? (
                <IconContext.Provider value={{ contextSize: size }}>
                  {_iconLeft}
                </IconContext.Provider>
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

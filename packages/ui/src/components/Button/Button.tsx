'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cloneElement, forwardRef, isValidElement } from 'react'

import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../lib/constants'
import { cn } from '../../lib/utils/cn'

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
          bg-brand-400 dark:bg-brand-500
          hover:bg-brand/80 dark:hover:bg-brand/50
          text-foreground
          border-brand-500/75 dark:border-brand/30
          hover:border-brand-600 dark:hover:border-brand
          focus-visible:outline-brand-600
          data-[state=open]:bg-brand-400/80 dark:data-[state=open]:bg-brand-500/80
          data-[state=open]:outline-brand-600
          `,
        default: `
          text-foreground
          bg-alternative dark:bg-muted  hover:bg-selection
          border-strong hover:border-stronger
          focus-visible:outline-brand-600
          data-[state=open]:bg-selection
          data-[state=open]:outline-brand-600
          data-[state=open]:border-button-hover
          `,
        secondary: `
          bg-foreground
          text-background hover:text-border-stronger
          focus-visible:text-border-control
          border-foreground-light hover:border-foreground-lighter
          focus-visible:outline-border-strong
          data-[state=open]:border-foreground-lighter
          data-[state=open]:outline-border-strong
        `,
        /** @deprecated use 'primary' instead */
        alternative: `
          text-foreground
          bg-brand-400 hover:bg-brand-500
          border-brand-500
          focus-visible:border-brand-500
          focus-visible:outline-brand-600
          data-[state=open]:bg-brand-500
          data-[state=open]:border-brand-500
          data-[state=open]:outline-brand-600
        `,
        outline: `
          text-foreground
          bg-transparent
          border-strong hover:border-foreground-muted
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
        `,
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
          border-transparent
        `,
        danger: `
          text-foreground
          bg-destructive-300 dark:bg-destructive-400 hover:bg-destructive-400 dark:hover:bg-destructive/50
          border-destructive-500 hover:border-destructive
          hover:text-hi-contrast
          focus-visible:outline-amber-700
          data-[state=open]:border-destructive
          data-[state=open]:bg-destructive-400 dark:data-[state=open]:bg-destructive-/50
          data-[state=open]:outline-destructive
        `,
        warning: `
          text-foreground
          bg-warning-300 dark:bg-warning-400 hover:bg-warning-400 dark:hover:bg-warning/50
          border-warning-500 hover:border-warning
          hover:text-hi-contrast
          focus-visible:outline-amber-700
          data-[state=open]:border-warning
          data-[state=open]:bg-warning-400 dark:data-[state=open]:bg-warning-/50
          data-[state=open]:outline-warning
        `,
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
        true: 'opacity-50 cursor-not-allowed pointer-events-none',
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
    type: {
      primary: 'text-brand-600',
      default: 'text-foreground-lighter',
      secondary: 'text-border-muted',
      alternative: 'text-foreground-lighter',
      outline: 'text-foreground-lighter',
      dashed: 'text-foreground-lighter',
      link: 'text-brand-600',
      text: 'text-foreground-lighter',
      danger: 'text-destructive-600',
      warning: 'text-warning',
    },
  },
})

export type LoadingVariantProps = VariantProps<typeof loadingVariants>
const loadingVariants = cva('', {
  variants: {
    type: {
      primary: 'text-brand-600',
      default: 'text-foreground-lighter',
      secondary: 'text-border-muted',
      alternative: 'text-foreground-lighter',
      outline: 'text-foreground-lighter',
      dashed: 'text-foreground-lighter',
      link: 'text-brand-600',
      text: 'text-foreground-muted',
      danger: 'text-destructive-600',
      warning: 'text-warning',
    },
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
    Omit<LoadingVariantProps, 'type'> {
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
    const { className, tabIndex } = props
    const showIcon = loading || icon
    // decrecating 'showIcon' for rightIcon
    const _iconLeft: React.ReactNode = icon ?? iconLeft
    // if loading, button is disabled
    const disabled = loading === true || props.disabled

    // Set default tabIndex for proper Safari focus handling
    // - Explicit tabIndex prop takes precedence
    // - If disabled, default to -1 (unless explicitly set)
    // - Otherwise, default to 0 for keyboard accessibility
    const computedTabIndex = tabIndex !== undefined ? tabIndex : disabled ? -1 : 0

    return (
      <Comp
        ref={ref}
        data-size={size}
        type={htmlType}
        {...props}
        disabled={disabled}
        tabIndex={computedTabIndex}
        className={cn(buttonVariants({ type, size, disabled, block, rounded }), className)}
        onClick={(e) => {
          // [Joshen] Prevents redirecting if Button is used with a link-based child element
          if (disabled) return e.preventDefault()
          else props?.onClick?.(e)
        }}
      >
        {asChild ? (
          isValidElement(children) ? (
            cloneElement(
              children,
              undefined,
              showIcon &&
                (loading ? (
                  <div className={cn(IconContainerVariants({ size, type }))}>
                    <Loader2 className={cn(loadingVariants({ loading, type }))} />
                  </div>
                ) : _iconLeft ? (
                  <div className={cn(IconContainerVariants({ size, type }))}>{_iconLeft}</div>
                ) : null),
              children.props.children && (
                <span className={'truncate'}>{children.props.children}</span>
              ),
              iconRight && !loading && (
                <div className={cn(IconContainerVariants({ size, type }))}>{iconRight}</div>
              )
            )
          ) : null
        ) : (
          <>
            {showIcon &&
              (loading ? (
                <div className={cn(IconContainerVariants({ size, type }))}>
                  <Loader2 className={cn(loadingVariants({ loading, type }))} />
                </div>
              ) : _iconLeft ? (
                <div className={cn(IconContainerVariants({ size, type }))}>{_iconLeft}</div>
              ) : null)}{' '}
            {children && <span className={'truncate'}>{children}</span>}{' '}
            {iconRight && !loading && (
              <div className={cn(IconContainerVariants({ size, type }))}>{iconRight}</div>
            )}
          </>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }

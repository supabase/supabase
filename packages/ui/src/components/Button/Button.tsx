import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'class-variance-authority'
import React from 'react'
import { IconContext } from '@ui/components/Icon/IconContext'
import { IconLoader } from '@ui/components/Icon/icons/IconLoader'
import { sizes } from '@ui/lib/commonCva'
import { cn } from '@ui/lib/utils'

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
const buttonVariants = cva(
  `relative 
  flex iems-center justify-center
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
            bg-brand-fixed-1100 hover:bg-brand-fixed-1000
            text-white
            border-brand-fixed-1000 hover:border-brand-fixed-900 dark:border-brand-fixed-1000 dark:hover:border-brand-fixed-1000
            focus-visible:outline-brand-600
            shadow-sm`,
        secondary: `
            bg-scale-1200
            text-scale-100 hover:text-scale-800
            focus-visible:text-scale-600
            border-scale-1100 hover:border-scale-900
            focus-visible:outline-scale-700
            shadow-sm`,
        default: `
            text-scale-1200
            bg-scale-100 hover:bg-scale-300
            border-scale-600 hover:border-scale-700
            dark:border-scale-700 hover:dark:border-scale-800
            dark:bg-scale-500 dark:hover:bg-scale-600
            focus-visible:outline-brand-600
            shadow-sm`,
        alternative: `
            text-brand-1100
            bg-brand-200 hover:bg-brand-400
            border-brand-600 hover:border-brand-300
            dark:border-brand-700 hover:dark:border-brand-300
            focus-visible:border-brand-300
            focus-visible:outline-brand-600
            shadow-sm`,
        outline: `
            text-scale-1200
            bg-transparent
            border-scale-600 hover:border-scale-700
            dark:border-scale-800 hover:dark:border-scale-900
            focus-visible:outline-scale-700`,
        dashed: `
            text-scale-1200
            border
            border-dashed
            border-scale-700 hover:border-scale-900
            bg-transparent
            focus-visible:outline-scale-700
            shadow-sm`,
        link: `
            text-brand-1100
            border
            border-transparent
            hover:bg-brand-400
            border-opacity-0
            bg-opacity-0 dark:bg-opacity-0
            shadow-none
            focus-visible:outline-scale-700`,
        text: `
            text-scale-1200
            hover:bg-scale-500
            shadow-none
            focus-visible:outline-scale-700
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
        base: `absolute inset-0 bg-scale-200 opacity-50`,
        container: `fixed inset-0 transition-opacity`,
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed pointer-events-none',
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
        className={cn(buttonVariants({ type, size, disabled, block }), className)}
      >
        {asChild ? (
          React.isValidElement(children) ? (
            React.cloneElement(
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

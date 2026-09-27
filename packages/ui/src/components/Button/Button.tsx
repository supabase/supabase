'use client'

import { cva, VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { Slot } from 'radix-ui'
import { cloneElement, forwardRef, isValidElement, ReactNode } from 'react'

import { SIZE_VARIANTS } from '../../lib/constants'
import { cn } from '../../lib/utils/cn'
import { getExplicitTabIndex } from '../../lib/utils/getExplicitTabIndex'

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
// Normalize the shared border curve at contrast 0.5: (0.05 + 0.95 * 0.5)² = 0.275625.
const buttonVariants = cva(
  `relative
  inline-flex items-center justify-center
  cursor-pointer
  space-x-2
  text-center
  font-medium
  ease-[cubic-bezier(0.22,1,0.36,1)]
  duration-200
  rounded-md
  transition-[background-color,border-color,color,scale]
  [&:not([aria-haspopup])]:motion-safe:active:scale-[0.97]
  focus-ring
  border
  [--button-shadow-opacity:0.04] dark:[--button-shadow-opacity:0.2]
  [--button-edge-strength:calc(var(--contrast-border,0.275625)/0.275625*0.6)]
  dark:[--button-edge-strength:calc(var(--contrast-border,0.275625)/0.275625)]
  [--button-edge-color:var(--colors-black)] dark:[--button-edge-color:var(--colors-white)]
  [--button-shadow-drop:0_1px_3px_0_hsl(var(--colors-black)/var(--button-shadow-opacity))]
  [--button-shadow-raised:var(--button-shadow-drop),inset_0_1px_0_0_hsl(var(--button-edge-color)/calc(0.04*var(--button-edge-strength))),inset_0_0_0_1px_hsl(var(--button-edge-color)/calc(0.06*var(--button-edge-strength))),inset_0_0_0_1px_hsl(var(--button-edge-color)/calc(0.1*var(--button-edge-strength)))]
  [--button-shadow-default:var(--button-shadow-drop),inset_0_1px_0_0_hsl(var(--button-edge-color)/calc(0.04*var(--button-edge-strength))),inset_0_0_0_1px_hsl(var(--colors-black)/calc(0.06*var(--button-edge-strength))),inset_0_-1px_0_0_hsl(var(--colors-black)/calc(0.06*var(--button-edge-strength))),inset_0_0_0_1px_hsl(var(--button-edge-color)/calc(0.1*var(--button-edge-strength)))]
  `,
  {
    variants: {
      variant: {
        primary: `
          border-0
          bg-primary-solid
          bg-[linear-gradient(to_bottom,hsl(var(--colors-white)/0.015),hsl(var(--colors-black)/0.01))]
          text-primary-solid-foreground
          shadow-[var(--button-shadow-raised)]
          hover:bg-[var(--primary-solid-hover)]
          data-[state=open]:bg-[var(--primary-solid-hover)]
          `,
        default: `
          text-foreground
          border-0
          bg-card hover:bg-muted dark:bg-muted dark:hover:bg-accent
          dark:bg-[linear-gradient(to_bottom,hsl(var(--colors-white)/0.015),hsl(var(--colors-black)/0.01))]
          shadow-[var(--button-shadow-default)]
          data-[state=open]:bg-muted dark:data-[state=open]:bg-accent
          `,
        secondary: `
          bg-foreground
          text-background
          border-0
          shadow-[var(--button-shadow-drop)]
          hover:bg-foreground/90
          data-[state=open]:bg-foreground/90
        `,
        outline: `
          text-foreground
          bg-transparent
          border-strong hover:border-foreground-muted
          data-[state=open]:border-stronger
        `,
        dashed: `
          text-foreground
          border
          border-dashed
          border-strong hover:border-control-hover
          bg-transparent
          data-[state=open]:border-control-hover
        `,
        link: `
          text-primary
          border
          border-transparent/0
          hover:bg-primary-bright/15
          shadow-none
          data-[state=open]:bg-primary-bright/15
        `,
        text: `
          text-foreground
          hover:bg-accent
          shadow-none
          data-[state=open]:bg-accent
          border-transparent
        `,
        danger: `
          border-0
          bg-destructive
          bg-[linear-gradient(to_bottom,hsl(var(--colors-white)/0.015),hsl(var(--colors-black)/0.01))]
          text-destructive-foreground
          shadow-[var(--button-shadow-raised)]
          hover:bg-[var(--destructive-hover)]
          data-[state=open]:bg-[var(--destructive-hover)]
        `,
        warning: `
          border-0
          bg-warning
          bg-[linear-gradient(to_bottom,hsl(var(--colors-white)/0.015),hsl(var(--colors-black)/0.01))]
          text-warning-foreground
          shadow-[var(--button-shadow-raised)]
          hover:bg-[var(--warning-hover)]
          data-[state=open]:bg-[var(--warning-hover)]
        `,
      },
      block: {
        true: 'w-full flex items-center justify-center',
      },
      size: {
        // Larger sizes soften the curve; cn() merges these over base rounded-md.
        // Radius stays on Button (not SIZE_VARIANTS) because that map is shared with Input/Select.
        tiny: `${SIZE_VARIANTS.tiny} rounded-md`,
        small: `${SIZE_VARIANTS.small} rounded-[calc(var(--radius-md)*(1+(34/26-1)*0.35))]`,
        medium: `${SIZE_VARIANTS.medium} rounded-[calc(var(--radius-md)*(1+(38/26-1)*0.35))]`,
        large: `${SIZE_VARIANTS.large} rounded-[calc(var(--radius-md)*(1+(42/26-1)*0.35))]`,
        xlarge: `${SIZE_VARIANTS.xlarge} rounded-[calc(var(--radius-md)*(1+(50/26-1)*0.35))]`,
      },
      overlay: {
        base: `absolute inset-0 bg-background opacity-50`,
        container: `fixed inset-0 transition-opacity`,
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed pointer-events-none',
      },
      focusableWhenDisabled: {
        true: 'opacity-50 cursor-not-allowed',
      },
      rounded: {
        true: 'rounded-full',
      },
    },
    // Match <Button size="tiny"> so raw buttonVariants({ variant }) keeps sizing.
    // Fixed icon shells that omit size must override padding (e.g. px-0 with h/w-[30px]).
    defaultVariants: {
      size: 'tiny',
    },
  }
)

const IconContainerVariants = cva('inline-flex items-center justify-center shrink-0', {
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
    variant: {
      primary: 'text-primary-solid-foreground/50',
      default: 'text-foreground-lighter',
      secondary: 'text-background',
      alternative: 'text-foreground-lighter',
      outline: 'text-foreground-lighter',
      dashed: 'text-foreground-lighter',
      link: 'text-primary',
      text: 'text-foreground-lighter',
      danger: 'text-destructive-foreground/50',
      warning: 'text-warning-foreground/50',
    },
  },
})

export type LoadingVariantProps = VariantProps<typeof loadingVariants>
const loadingVariants = cva('', {
  variants: {
    variant: {
      primary: 'text-primary-solid-foreground/50',
      default: 'text-foreground-lighter',
      secondary: 'text-background',
      alternative: 'text-foreground-lighter',
      outline: 'text-foreground-lighter',
      dashed: 'text-foreground-lighter',
      link: 'text-primary',
      text: 'text-foreground-muted',
      danger: 'text-destructive-foreground/50',
      warning: 'text-warning-foreground/50',
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
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    // omit 'disabled' as it is included in HTMLButtonElement
    Omit<ButtonVariantProps, 'disabled'>,
    LoadingVariantProps {
  asChild?: boolean
  variant?: ButtonVariantProps['variant']
  icon?: React.ReactNode
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  rounded?: boolean
  /**
   * Keeps a disabled button keyboard-focusable by using `aria-disabled`
   * instead of native `disabled`. Use this when the control needs a tooltip
   * or other explanation.
   */
  focusableWhenDisabled?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      size = 'tiny',
      variant = 'default',
      children,
      loading,
      block,
      icon,
      iconRight,
      iconLeft,
      type = 'button',
      rounded,
      focusableWhenDisabled: focusableWhenDisabledProp,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot.Slot : 'button'
    const { className, tabIndex, disabled: disabledProp, onClick, ...rest } = props
    const showIcon = loading || icon
    // decrecating 'showIcon' for rightIcon
    const _iconLeft: React.ReactNode = icon ?? iconLeft
    const isLoading = loading === true
    // if loading, button is disabled
    const disabled = isLoading || disabledProp === true
    const focusableWhenDisabled = disabled && focusableWhenDisabledProp === true
    const nativeDisabled = disabled && !focusableWhenDisabled

    const computedTabIndex = getExplicitTabIndex(tabIndex, nativeDisabled)

    const renderIconContainer = (content: ReactNode) => (
      <div aria-hidden className={cn(IconContainerVariants({ size, variant }))}>
        {content}
      </div>
    )

    const handleActivation = (e: React.MouseEvent, childOnClick?: React.MouseEventHandler) => {
      if (disabled) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      childOnClick?.(e)
      if (!e.defaultPrevented) {
        onClick?.(e as React.MouseEvent<HTMLButtonElement>)
      }
    }

    return (
      <Comp
        ref={ref}
        data-size={size}
        type={type}
        {...rest}
        aria-disabled={focusableWhenDisabled || undefined}
        disabled={nativeDisabled}
        tabIndex={computedTabIndex}
        className={cn(
          buttonVariants({
            variant,
            size,
            disabled: nativeDisabled,
            focusableWhenDisabled,
            block,
            rounded,
          }),
          className
        )}
        onClick={asChild ? undefined : (e) => handleActivation(e)}
      >
        {asChild ? (
          isValidElement<{ children: ReactNode; onClick?: React.MouseEventHandler }>(children) ? (
            cloneElement(
              children,
              {
                onClick: (e) => handleActivation(e, children.props.onClick),
              },
              showIcon &&
                (loading
                  ? renderIconContainer(
                      <Loader2 className={cn(loadingVariants({ loading, variant }))} />
                    )
                  : _iconLeft
                    ? renderIconContainer(_iconLeft)
                    : null),
              children.props.children && (
                <span className={'truncate'}>{children.props.children}</span>
              ),
              iconRight && !loading && renderIconContainer(iconRight)
            )
          ) : null
        ) : (
          <>
            {showIcon &&
              (loading
                ? renderIconContainer(
                    <Loader2 className={cn(loadingVariants({ loading, variant }))} />
                  )
                : _iconLeft
                  ? renderIconContainer(_iconLeft)
                  : null)}{' '}
            {children && <span className={'truncate'}>{children}</span>}{' '}
            {iconRight && !loading && renderIconContainer(iconRight)}
          </>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }

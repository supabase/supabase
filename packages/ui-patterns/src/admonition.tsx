import { cva } from 'class-variance-authority'
import { ComponentProps, forwardRef, ReactNode } from 'react'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, cn } from 'ui'

export interface AdmonitionProps {
  type:
    | 'note'
    | 'tip'
    | 'caution'
    | 'danger'
    | 'deprecation'
    | 'default'
    | 'destructive'
    | 'warning'
  label?: string
  title?: string
  description?: string | ReactNode
  showIcon?: boolean
  childProps?: {
    title?: ComponentProps<typeof AlertTitle_Shadcn_>
    description?: ComponentProps<typeof AlertDescription_Shadcn_>
  }
  layout?: 'horizontal' | 'vertical' | 'responsive'
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}

const admonitionToAlertMapping: Record<
  AdmonitionProps['type'],
  'default' | 'destructive' | 'warning'
> = {
  note: 'default',
  tip: 'default',
  caution: 'warning',
  danger: 'destructive',
  deprecation: 'warning',
  default: 'default',
  warning: 'warning',
  destructive: 'destructive',
}

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 21 20"
    className="w-6 h-6"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.625 9.8252C0.625 4.44043 4.99023 0.0751953 10.375 0.0751953C15.7598 0.0751953 20.125 4.44043 20.125 9.8252C20.125 15.21 15.7598 19.5752 10.375 19.5752C4.99023 19.5752 0.625 15.21 0.625 9.8252ZM9.3584 4.38135C9.45117 4.28857 9.55518 4.20996 9.66699 4.14648C9.88086 4.02539 10.1245 3.96045 10.375 3.96045C10.5845 3.96045 10.7896 4.00586 10.9766 4.09229C11.1294 4.1626 11.2705 4.26025 11.3916 4.38135C11.6611 4.65088 11.8125 5.0166 11.8125 5.39795C11.8125 5.5249 11.7959 5.6499 11.7637 5.77002C11.6987 6.01172 11.5718 6.23438 11.3916 6.41455C11.1221 6.68408 10.7563 6.83545 10.375 6.83545C9.99365 6.83545 9.62793 6.68408 9.3584 6.41455C9.08887 6.14502 8.9375 5.7793 8.9375 5.39795C8.9375 5.29492 8.94873 5.19287 8.97021 5.09375C9.02783 4.82568 9.16162 4.57812 9.3584 4.38135ZM10.375 15.6899C10.0933 15.6899 9.82275 15.5781 9.62354 15.3789C9.42432 15.1797 9.3125 14.9092 9.3125 14.6274V9.31494C9.3125 9.0332 9.42432 8.7627 9.62354 8.56348C9.82275 8.36426 10.0933 8.25244 10.375 8.25244C10.6567 8.25244 10.9272 8.36426 11.1265 8.56348C11.3257 8.7627 11.4375 9.0332 11.4375 9.31494V14.6274C11.4375 14.7944 11.3979 14.9575 11.3242 15.104C11.2739 15.2046 11.2075 15.2979 11.1265 15.3789C10.9272 15.5781 10.6567 15.6899 10.375 15.6899Z"
    />
  </svg>
)

const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 22 20"
    className="w-6 h-6"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.15137 1.95117C9.30615 -0.0488281 12.1943 -0.0488281 13.3481 1.95117L20.7031 14.6992C21.8574 16.6992 20.4131 19.1992 18.104 19.1992H3.39502C1.08594 19.1992 -0.356933 16.6992 0.797364 14.6992L8.15137 1.95117ZM11.7666 16.0083C11.4971 16.2778 11.1313 16.4292 10.75 16.4292C10.3687 16.4292 10.0029 16.2778 9.7334 16.0083C9.46387 15.7388 9.3125 15.373 9.3125 14.9917C9.3125 14.9307 9.31641 14.8706 9.32373 14.811C9.33545 14.7197 9.35547 14.6304 9.38379 14.5439L9.41406 14.4609C9.48584 14.2803 9.59375 14.1147 9.7334 13.9751C10.0029 13.7056 10.3687 13.5542 10.75 13.5542C11.1313 13.5542 11.4971 13.7056 11.7666 13.9751C12.0361 14.2446 12.1875 14.6104 12.1875 14.9917C12.1875 15.373 12.0361 15.7388 11.7666 16.0083ZM10.75 4.69971C11.0317 4.69971 11.3022 4.81152 11.5015 5.01074C11.7007 5.20996 11.8125 5.48047 11.8125 5.76221V11.0747C11.8125 11.3564 11.7007 11.627 11.5015 11.8262C11.3022 12.0254 11.0317 12.1372 10.75 12.1372C10.4683 12.1372 10.1978 12.0254 9.99854 11.8262C9.79932 11.627 9.6875 11.3564 9.6875 11.0747V5.76221C9.6875 5.48047 9.79932 5.20996 9.99854 5.01074C10.1978 4.81152 10.4683 4.69971 10.75 4.69971Z"
    />
  </svg>
)

const admonitionSVG = cva('', {
  variants: {
    type: {
      default: `[&>svg]:bg-foreground-muted`,
      warning: ``,
      destructive: ``,
    },
  },
})

export const Admonition = forwardRef<
  React.ElementRef<typeof Alert_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof Alert_Shadcn_> & AdmonitionProps
>(
  (
    {
      type = 'note',
      variant,
      showIcon = true,
      label,
      title,
      description,
      children,
      layout = 'vertical',
      actions,
      childProps = {},
      icon,
      ...props
    },
    ref
  ) => {
    const typeMapped = variant ? admonitionToAlertMapping[variant] : admonitionToAlertMapping[type]

    return (
      <Alert_Shadcn_
        ref={ref}
        variant={typeMapped}
        {...props}
        className={cn(
          // Handle occasional background elements
          'overflow-hidden',
          // Container query context for responsive layout
          layout === 'responsive' && '@container',
          // SVG icon
          admonitionSVG({ type: typeMapped }),
          props.className
        )}
      >
        {!!icon ? (
          icon
        ) : (showIcon && typeMapped === 'warning') || typeMapped === 'destructive' ? (
          <WarningIcon />
        ) : showIcon ? (
          <InfoIcon />
        ) : null}
        <div
          className={cn(
            'flex',
            layout === 'vertical' && 'flex-col',
            layout === 'horizontal' && 'flex-row items-center justify-between gap-x-6 lg:gap-x-8',
            layout === 'responsive' &&
              'flex-col @md:flex-row @md:items-center @md:justify-between @md:gap-x-6 @lg:gap-x-8'
          )}
        >
          {label || title ? (
            <div>
              <AlertTitle_Shadcn_
                {...childProps.title}
                className={cn(
                  'text mt-0.5 flex gap-3 text-sm',
                  !label && 'flex-col',
                  childProps.title?.className
                )}
              >
                {label || title}
              </AlertTitle_Shadcn_>
              {description && (
                <AlertDescription_Shadcn_ className={childProps.description?.className}>
                  {description}
                </AlertDescription_Shadcn_>
              )}
              {/* // children is to handle Docs and MDX issues with children and <p> elements */}
              {children && (
                <AlertDescription_Shadcn_
                  {...childProps.description}
                  className={cn('', childProps?.description?.className)}
                >
                  {children}
                </AlertDescription_Shadcn_>
              )}
            </div>
          ) : (
            <div className="text my-0.5 [&_p]:mt-0 [&_p]:mb-1.5 [&_p:last-child]:mb-0">
              {children}
            </div>
          )}
          {actions && (
            <div
              className={cn(
                'flex flex-row gap-3',
                layout === 'vertical' && 'mt-3 items-start',
                layout === 'horizontal' && 'items-center',
                layout === 'responsive' && 'mt-3 items-start @md:mt-0 @md:items-center'
              )}
            >
              {actions}
            </div>
          )}
        </div>
      </Alert_Shadcn_>
    )
  }
)

import { forwardRef } from 'react'
import { Alert, AlertDescription, AlertTitle, cn } from 'ui'

import { TYPE_LABEL, TYPE_TO_VARIANT } from './Admonition.constants'
import type { AdmonitionLayout, AdmonitionProps, AdmonitionType } from './Admonition.types'
import { AdmonitionTypeIcon } from './AdmonitionIcons'

export type { AdmonitionLayout, AdmonitionProps, AdmonitionType }

const admonitionBodyClassName =
  '[&_p]:!mt-0 [&_p]:!mb-1.5 [&_p:last-child]:!mb-0 [&_ul]:!my-1.5 [&_ol]:!my-1.5 [&_li]:!my-0.5'

export const Admonition = forwardRef<
  React.ComponentRef<typeof Alert>,
  Omit<
    React.ComponentPropsWithoutRef<typeof Alert>,
    keyof AdmonitionProps | 'children' | 'variant'
  > &
    AdmonitionProps
>(
  (
    {
      type = 'note',
      showIcon = true,
      title,
      description,
      children,
      layout = 'vertical',
      actions,
      childProps,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const label = TYPE_LABEL[type]

    return (
      <Alert
        ref={ref}
        {...props}
        aria-label={label}
        variant={TYPE_TO_VARIANT[type]}
        className={cn(
          'overflow-hidden',
          layout === 'responsive' && '@container',
          type === 'success' && [
            'bg-brand-400/15 dark:bg-brand/10',
            'border-brand-400 dark:border-brand-500',
          ],
          className
        )}
      >
        <div className="flex items-start gap-3">
          {showIcon && (icon ?? <AdmonitionTypeIcon type={type} />)}
          <div
            className={cn(
              'min-w-0 flex-1',
              layout === 'vertical' && 'flex flex-col',
              layout === 'horizontal' && [
                'flex flex-row items-center justify-between',
                'gap-x-6 lg:gap-x-8',
              ],
              layout === 'responsive' && [
                'flex flex-col',
                '@md:flex-row @md:items-center @md:justify-between',
                '@md:gap-x-6 @lg:gap-x-8',
              ]
            )}
          >
            <div>
              {title && (
                <AlertTitle
                  {...childProps?.title}
                  className={cn('text-foreground', childProps?.title?.className)}
                >
                  {title}
                </AlertTitle>
              )}
              {description && (
                <AlertDescription
                  {...childProps?.description}
                  className={cn(admonitionBodyClassName, childProps?.description?.className)}
                >
                  {description}
                </AlertDescription>
              )}
              {children && (
                <AlertDescription
                  {...childProps?.description}
                  className={cn(admonitionBodyClassName, childProps?.description?.className)}
                >
                  {children}
                </AlertDescription>
              )}
            </div>
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
        </div>
      </Alert>
    )
  }
)

import { forwardRef } from 'react'
import { Alert, AlertDescription, cn } from 'ui'

import { TYPE_LABEL, TYPE_TO_VARIANT } from './Admonition.constants'
import type { AdmonitionLayout, AdmonitionProps, AdmonitionType } from './Admonition.types'
import { AdmonitionTypeIcon } from './AdmonitionIcons'

export type { AdmonitionLayout, AdmonitionProps, AdmonitionType }

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
            <div
              {...childProps?.description}
              className={cn(
                'text-foreground-light',
                // Exclude the title <p> so these MDX body resets don't override its mb-0.5
                // ([&_p]:!mb-1.5 beats !mb-0.5 on specificity: class+element vs class).
                '[&_p:not([data-admonition-title])]:!mt-0 [&_p:not([data-admonition-title])]:!mb-1.5 [&_p:not([data-admonition-title]):last-child]:!mb-0',
                '[&_ul]:!my-1.5 [&_ol]:!my-1.5 [&_li]:!my-0.5',
                childProps?.description?.className
              )}
            >
              {title && (
                <p
                  {...childProps?.title}
                  data-admonition-title
                  className={cn('mb-0.5 font-medium text-foreground', childProps?.title?.className)}
                >
                  {title}
                </p>
              )}
              {description && <AlertDescription>{description}</AlertDescription>}
              {children}
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

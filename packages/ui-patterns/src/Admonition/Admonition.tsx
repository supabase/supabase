import { forwardRef } from 'react'
import { Alert, AlertDescription, AlertTitle, cn } from 'ui'

import { TYPE_LABEL, TYPE_TO_VARIANT } from './Admonition.constants'
import type { AdmonitionLayout, AdmonitionProps, AdmonitionType } from './Admonition.types'
import { AdmonitionTypeIcon } from './AdmonitionIcons'

export type { AdmonitionLayout, AdmonitionProps, AdmonitionType }

const admonitionBodyClassName = [
  'text-sm leading-[1.625] [&_code]:text-[0.75rem]',
  'mb-0 [&_p]:mt-0 [&_p]:mb-1.5 [&_p:last-child]:mb-0',
  '[&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5',
  '[&_ul]:list-none [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4',
  '[&_ul>li]:relative [&_ul>li]:before:absolute [&_ul>li]:before:left-[-1rem] [&_ul>li]:before:top-2.5 [&_ul>li]:before:h-0.5 [&_ul>li]:before:w-2 [&_ul>li]:before:rounded [&_ul>li]:before:bg-border-strong [&_ul>li]:before:content-[""]',
].join(' ')

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
          'overflow-hidden text-sm leading-[1.5]',
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
              className={cn(
                showIcon && (title || description || children) && (title ? 'mt-0.75' : 'mt-0.5')
              )}
            >
              {title && (
                <AlertTitle
                  {...childProps?.title}
                  className={cn('!mt-0 text-foreground', childProps?.title?.className)}
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
                  'flex flex-row gap-2',
                  '[&_button]:text-xs [&_a]:text-xs',
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

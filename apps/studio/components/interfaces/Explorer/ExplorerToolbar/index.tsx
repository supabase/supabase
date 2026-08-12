import { Edit } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button, cn } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export type ExplorerToolbarProps = React.ComponentProps<'div'>

/**
 * Shared toolbar row for Explorer resources such as notebooks and queries.
 * Defaults to 40px and follows `--header-height` from the `md` breakpoint up, so
 * a consumer that defines its own header height gets toolbars matching it. The
 * fallback keeps the row at its default height in apps that leave the variable
 * unset, rather than dropping the rule.
 */
const ExplorerToolbar = ({ className, role = 'toolbar', ...props }: ExplorerToolbarProps) => (
  <div
    data-slot="explorer-toolbar"
    role={role}
    className={cn(
      'flex h-10 w-full shrink-0 items-center gap-2 border-b bg-transparent px-3',
      className
    )}
    {...props}
  />
)
ExplorerToolbar.displayName = 'ExplorerToolbar'

export type ExplorerToolbarIconProps = React.ComponentProps<'span'>

/** Decorative resource icon shown before the toolbar title. */
const ExplorerToolbarIcon = ({
  'aria-hidden': ariaHidden = true,
  className,
  ...props
}: ExplorerToolbarIconProps) => (
  <span
    data-slot="explorer-toolbar-icon"
    aria-hidden={ariaHidden}
    className={cn('shrink-0 text-foreground-muted [&_svg]:size-3.5', className)}
    {...props}
  />
)
ExplorerToolbarIcon.displayName = 'ExplorerToolbarIcon'

export type ExplorerToolbarTitleProps = React.ComponentProps<'div'> & {
  title: string
  onSaveTitle?: (value: string) => void
}

/** Flexible title region for static text or an editable resource name. */
const ExplorerToolbarTitle = ({
  title,
  className,
  onSaveTitle,
  ...props
}: ExplorerToolbarTitleProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [value, setValue] = useState(title)

  useEffect(() => {
    if (isEditingTitle) setValue(title)
  }, [isEditingTitle, title])

  return (
    <div
      data-slot="explorer-toolbar-title"
      className={cn('min-w-0 flex-1 truncate text-sm', className)}
      {...props}
    >
      {isEditingTitle ? (
        <Input
          autoFocus
          size="tiny"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (isEditingTitle) {
              setIsEditingTitle(false)
              onSaveTitle?.(value)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              setIsEditingTitle(false)
              setValue(title ?? '')
            } else if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              setIsEditingTitle(false)
              onSaveTitle?.(value)
            }
          }}
        />
      ) : (
        <Button
          variant="text"
          className="group"
          onClick={() => setIsEditingTitle(true)}
          iconRight={<Edit className="opacity-0 group-hover:opacity-100 transition" />}
        >
          {value}
        </Button>
      )}
    </div>
  )
}
ExplorerToolbarTitle.displayName = 'ExplorerToolbarTitle'

export type ExplorerToolbarActionsProps = React.ComponentProps<'div'>

/**
 * Trailing region for direct actions and composite controls such as badges,
 * source menus, and display configuration.
 */
const ExplorerToolbarActions = ({ className, ...props }: ExplorerToolbarActionsProps) => (
  <div
    data-slot="explorer-toolbar-actions"
    className={cn('ml-auto flex shrink-0 items-center gap-px', className)}
    {...props}
  />
)
ExplorerToolbarActions.displayName = 'ExplorerToolbarActions'

export type ExplorerToolbarActionProps = Omit<
  React.ComponentPropsWithRef<typeof Button>,
  'size' | 'variant'
> & {
  tooltip?: string
}

/**
 * The standard tiny, text-style button used for a direct toolbar action.
 * Icon-only actions receive the prototype's compact 28px width automatically.
 */
const ExplorerToolbarAction = ({
  children,
  className,
  ref,
  tooltip,
  ...props
}: ExplorerToolbarActionProps) => (
  <ButtonTooltip
    ref={ref}
    data-slot="explorer-toolbar-action"
    variant="text"
    size="tiny"
    className={cn(children == null && 'w-7 px-0', className)}
    tooltip={{ content: { side: 'bottom', text: tooltip } }}
    {...props}
  >
    {children}
  </ButtonTooltip>
)
ExplorerToolbarAction.displayName = 'ExplorerToolbarAction'

export {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
}

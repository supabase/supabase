import { Edit } from 'lucide-react'
import React, { useState } from 'react'
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
    className={cn('shrink-0 text-tertiary-foreground', className)}
    {...props}
  />
)
ExplorerToolbarIcon.displayName = 'ExplorerToolbarIcon'

export type ExplorerToolbarTitleProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  children: string
  onSaveTitle?: (value: string) => void
}

/** Flexible title region for static text or an editable resource name. */
const ExplorerToolbarTitle = ({
  children: title,
  className,
  onSaveTitle,
  ...props
}: ExplorerToolbarTitleProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [value, setValue] = useState(title)

  const handleStartEditing = () => {
    setValue(title)
    setIsEditingTitle(true)
  }

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
          containerClassName="max-w-64 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          className="outline-none"
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
            } else if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              setIsEditingTitle(false)
              onSaveTitle?.(value)
            }
          }}
        />
      ) : onSaveTitle ? (
        <ExplorerToolbarAction
          className="group/title"
          onClick={handleStartEditing}
          iconRight={
            <Edit
              size={16}
              strokeWidth={2}
              className="opacity-0 transition group-hover/title:opacity-100"
            />
          }
        >
          {title}
        </ExplorerToolbarAction>
      ) : (
        title
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
 * `!h-auto !w-auto` lets Lucide's `size` prop win over Button `tiny`'s 14px icon box.
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
    className={cn(
      'text-tertiary-foreground hover:text-foreground data-[state=open]:text-foreground',
      '[&>[aria-hidden]]:text-current [&_svg]:!h-auto [&_svg]:!w-auto',
      children == null && 'w-7 px-0',
      className
    )}
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

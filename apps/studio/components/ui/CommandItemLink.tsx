import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn, CommandItem } from 'ui'

export interface CommandItemLinkProps extends Omit<ComponentProps<typeof CommandItem>, 'children'> {
  href: ComponentProps<typeof Link>['href']
  linkProps?: Omit<ComponentProps<typeof Link>, 'children' | 'href'>
  children: ReactNode
}

/**
 * A command item that navigates with native link behaviour.
 *
 * The link must wrap the command item. Nesting a link inside a command item can
 * unmount the link when selection closes its menu before navigation completes.
 */
export function CommandItemLink({
  href,
  linkProps,
  children,
  disabled,
  ...commandItemProps
}: CommandItemLinkProps) {
  const commandItem = (
    <CommandItem disabled={disabled} {...commandItemProps}>
      {children}
    </CommandItem>
  )

  return disabled ? (
    commandItem
  ) : (
    <Link {...linkProps} href={href} className={cn('block', linkProps?.className)}>
      {commandItem}
    </Link>
  )
}

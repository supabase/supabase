import { HTMLAttributes, PropsWithChildren, forwardRef } from 'react'
import { cn } from '../../lib/utils/cn'
import { Slot } from '@radix-ui/react-slot'
import { tabsTriggerVariants } from '../shadcn/ui/tabs'

interface NavMenuProps extends HTMLAttributes<HTMLUListElement> {
  asChild?: boolean
}

const NavMenu = forwardRef<HTMLUListElement, NavMenuProps>(({ children, ...props }, ref) => {
  const Comp = props.asChild ? Slot : 'ul'
  return (
    <Comp role="menu" ref={ref} {...props} className={cn('flex gap-5', props.className)}>
      {children}
    </Comp>
  )
})
interface NavMenuItemProps extends HTMLAttributes<HTMLLIElement> {
  asChild?: boolean
}

const NavMenuItem = forwardRef<HTMLLIElement, NavMenuItemProps>(({ children, ...props }, ref) => {
  const Comp = props.asChild ? Slot : 'li'

  return (
    <Comp ref={ref} {...props}>
      {children}
    </Comp>
  )
})

interface NavMenuLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean
}

const NavMenuLink = forwardRef<HTMLAnchorElement, NavMenuLinkProps>(
  ({ children, ...props }, ref) => {
    const Comp = props.asChild ? Slot : 'a'

    return (
      <Comp ref={ref} role="menuitem" {...props} className={cn(tabsTriggerVariants)}>
        {children}
      </Comp>
    )
  }
)

export { NavMenu, NavMenuItem, NavMenuLink }

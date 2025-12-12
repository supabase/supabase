'use client'

import * as RadixCollapsible from '@radix-ui/react-collapsible'
import React from 'react'
import styleHandler from '../../lib/theme/styleHandler'

export interface CollapsibleProps extends RadixCollapsible.CollapsibleProps {
  children: React.ReactNode
}

/**
 * An interactive component that expands or collapses its content.
 * @param {object} props - The component props.
 * @param {boolean} [props.open] - The controlled open state of the collapsible.
 * @param {React.ReactNode} props.children - The content of the collapsible.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {React.ReactElement} The collapsible component.
 * @deprecated Use `import { Collapsible_shadcn_ } from "ui"` instead
 */
export const Collapsible = ({
  open = undefined,
  children,
  className,
  ...props
}: CollapsibleProps) => {
  return (
    <RadixCollapsible.Root
      asChild={props.asChild}
      defaultOpen={props.defaultOpen}
      open={open}
      onOpenChange={props.onOpenChange}
      disabled={props.disabled}
      className={className}
    >
      {children}
    </RadixCollapsible.Root>
  )
}

/**
 * The button that toggles the collapsible's open and closed states.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content of the trigger.
 * @param {boolean} [props.asChild] - Renders the component as a child, forwarding props to the first child.
 * @returns {React.ReactElement} The collapsible trigger component.
 * @deprecated Use ./CollapsibleTrigger_shadcn_ instead
 */
export function Trigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <RadixCollapsible.Trigger asChild={asChild}>{children}</RadixCollapsible.Trigger>
}

/**
 * The content of the collapsible that is hidden or shown.
 * @param {object} props - The component props.
 * @param {boolean} [props.asChild] - Renders the component as a child, forwarding props to the first child.
 * @param {React.ReactNode} props.children - The content of the collapsible.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {React.ReactElement} The collapsible content component.
 * @deprecated Use ./CollapsibleContent_shadcn_ instead
 */
export function Content({
  asChild,
  children,
  className,
}: {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}) {
  const __styles = styleHandler('collapsible')
  return (
    <RadixCollapsible.Content asChild={asChild} className={[__styles.content, className].join(' ')}>
      {children}
    </RadixCollapsible.Content>
  )
}

Collapsible.Trigger = Trigger
Collapsible.Content = Content
export default Collapsible

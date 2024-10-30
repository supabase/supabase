import { HTMLAttributes, forwardRef } from 'react'
import { cn } from 'ui'

interface Props {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  /**
   * Fades the panel and clicks are disabled
   */
  disabled?: boolean
}

const FormPanel = ({ children, header, footer }: Props) => (
  <FormPanelContainer>
    {header && <FormPanelHeader>{header}</FormPanelHeader>}
    <FormPanelContent className="divide-y">{children}</FormPanelContent>
    {footer && <FormPanelFooter>{footer}</FormPanelFooter>}
  </FormPanelContainer>
)

const FormPanelContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={cn('bg-surface-100 border overflow-hidden rounded-md shadow', props.className)}
    >
      {children}
    </div>
  )
)

FormPanelContainer.displayName = FormPanelContainer.displayName

const FormPanelHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className={cn('border-default border-b px-8 py-4', props.className)}>
      {children}
    </div>
  )
)

FormPanelHeader.displayName = FormPanelHeader.displayName

const FormPanelContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className={cn('divide-border flex flex-col gap-0', props.className)}>
      {children}
    </div>
  )
)

FormPanelContent.displayName = FormPanelContent.displayName

const FormPanelFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className={cn('border-t', props.className)}>
      {children}
    </div>
  )
)

FormPanelFooter.displayName = FormPanelFooter.displayName

export { FormPanel, FormPanelContainer, FormPanelContent, FormPanelHeader, FormPanelFooter }

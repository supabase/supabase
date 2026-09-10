import { ComponentPropsWithoutRef, ReactNode } from 'react'

export interface SupportFormParams {
  projectRef?: string
  orgSlug?: string
  category?: string
  subject?: string
  message?: string
  error?: string
  /** Sentry event ID */
  sid?: string
}

export interface ErrorDisplayProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * Title displayed in the header with warning icon
   * @example "Failed to retrieve tables"
   */
  title: string

  /**
   * Error message displayed in monospace code block style
   * @example "ERROR: FAILED TO RUN SQL QUERY: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT."
   */
  errorMessage: string

  /**
   * Typed params for the support form URL. The component builds the URL automatically.
   * The "Contact support" footer is always shown.
   * @example { projectRef: 'my-project' }
   */
  supportFormParams?: SupportFormParams

  /**
   * Text for the support link
   * @default "Contact support"
   */
  supportLabel?: string

  /**
   * Children slot for accordion-style troubleshooting steps
   * Typically contains TroubleshootingAccordion or similar content
   */
  children?: ReactNode

  /**
   * Additional CSS classes for the root container
   */
  className?: string

  /**
   * Custom icon to display in the header. Defaults to a filled warning triangle SVG.
   */
  icon?: ReactNode

  /**
   * Callback fired when the component is rendered
   * Useful for tracking error display events
   */
  onRender?: () => void

  /**
   * Callback fired when the contact support link is clicked
   * Useful for tracking support escalations
   */
  onSupportClick?: () => void
}

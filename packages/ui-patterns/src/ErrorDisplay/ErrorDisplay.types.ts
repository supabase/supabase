import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export type ErrorDisplayType = 'info' | 'warning' | 'destructive'

export type ErrorDisplaySize = 'auto' | 'compact' | 'full'

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

export interface ErrorDisplayDetails {
  /**
   * Raw error string, rendered in monospace exactly as given.
   * @example "Connection terminated due to connection timeout"
   */
  message: string

  /** Machine-readable error code, shown alongside the request ID. */
  code?: string

  /** Request ID for support escalations. */
  requestId?: string

  /** When the error happened. Dates are formatted as an ISO string. */
  timestamp?: string | Date
}

export interface ErrorDisplayStepAction {
  /**
   * Button label. Starts with a verb.
   * @example "Restart project"
   */
  label: string

  onClick?: () => void | Promise<void>

  /** Renders the action as a link. External links get an external-link icon. */
  href?: string

  icon?: ReactNode

  /**
   * Renders a custom control in place of the default button. Use only for controls
   * a button can't express — a split dropdown, say. `label` is still required, and
   * is what the compact layout announces.
   */
  render?: (props: { block?: boolean }) => ReactNode
}

export interface ErrorDisplayStep {
  id: string

  /**
   * Step heading, shown collapsed and expanded.
   * @example "Restart your project"
   */
  title: string

  /**
   * One line explaining what the step does. Revealed when the step expands in the
   * full layout, and used as the button tooltip in the compact layout.
   */
  description?: string

  action: ErrorDisplayStepAction
}

export interface ErrorDisplayProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /**
   * Visual treatment, matching the Admonition variant of the same name.
   * @default "info"
   */
  type?: ErrorDisplayType

  /**
   * Layout. `auto` switches on container width, not viewport width, so the same
   * component can sit in a wide panel and a narrow sidebar.
   * @default "auto"
   */
  size?: ErrorDisplaySize

  /**
   * What failed.
   * @example "Failed to retrieve tables"
   */
  title: string

  /**
   * Plain-language sentence explaining the failure, shown above the raw error.
   * @example "The database connection timed out before the query finished."
   */
  description?: string

  /** Raw error details. Omit to render no error block at all. */
  error?: ErrorDisplayDetails

  /** Shows a "Try again" button in the header. Never rendered as a numbered step. */
  onRetry?: () => void | Promise<void>

  /** @default "Try again" */
  retryLabel?: string

  /** Troubleshooting steps, ordered from least to most disruptive. */
  steps?: ErrorDisplayStep[]

  /** `id` of the step expanded on mount. Defaults to the first step. */
  defaultOpenStep?: string

  /** Fired when a numbered step expands or collapses. `null` when every step is collapsed. */
  onStepOpenChange?: (stepId: string | null) => void

  /** Fired with the error details when the support link is clicked. */
  onContactSupport?: (details?: ErrorDisplayDetails) => void

  /** Overrides the generated support URL. */
  supportHref?: string

  /**
   * Params for the support form URL. The component builds the URL and merges in
   * the error message and request ID so the form arrives prefilled.
   */
  supportFormParams?: SupportFormParams

  /** @default "Contact support" */
  supportLabel?: string

  /** Overrides the header icon. Defaults to the matching Admonition icon. */
  icon?: ReactNode

  /**
   * Escape hatch for troubleshooting content that `steps` can't express, such as
   * a dropdown or a dialog-backed action. Rendered after `steps` in both layouts.
   */
  children?: ReactNode

  /** Fired once on mount — use for telemetry. */
  onRender?: () => void

  className?: string
}

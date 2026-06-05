/**
 * Theme CSS variables backing each text shorthand on /docs/color-usage.
 * Accent colors use dedicated `-text` tokens so fills can keep `-default` values.
 */
export const textColorVariables: Record<string, string> = {
  text: '--foreground-default',
  'text-light': '--foreground-light',
  'text-lighter': '--foreground-lighter',
  'text-muted': '--foreground-muted',
  'text-contrast': '--foreground-contrast',
  'text-destructive': '--destructive-text',
  'text-warning': '--warning-text',
  'text-brand': '--brand-text',
  'text-brand-link': '--brand-link',
}

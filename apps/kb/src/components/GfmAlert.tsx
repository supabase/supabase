import type { PropsWithChildren } from 'react'
import { Admonition, type AdmonitionType } from 'ui-patterns/Admonition'

// GitHub's alert type -> the closest Admonition type + label. Admonition has
// no literal "tip"/"important" type, so TIP maps to the upbeat "success"
// treatment, and IMPORTANT/WARNING split across Admonition's two escalating
// severities ("warning" then "danger") so all five GFM kinds stay visually
// distinct. See:
// https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
const ALERTS: Record<string, { type: AdmonitionType; label: string }> = {
  note: { type: 'note', label: 'Note' },
  tip: { type: 'success', label: 'Tip' },
  important: { type: 'warning', label: 'Important' },
  warning: { type: 'danger', label: 'Warning' },
  caution: { type: 'caution', label: 'Caution' },
}

interface GfmAlertProps {
  type: string
}

/**
 * Renders remark-github-markdown-alerts' GFM alert output through the real
 * Admonition component. Wired up as an MDX component override in
 * src/pages/guides/[...slug].astro — see src/lib/gfm-alerts-rehype.ts for
 * how a `> [!NOTE] ...` blockquote becomes a `<GfmAlert type="note">` in the
 * first place.
 */
export function GfmAlert({ type, children }: PropsWithChildren<GfmAlertProps>) {
  const alert = ALERTS[type] ?? ALERTS.note
  return (
    <Admonition type={alert.type} title={alert.label}>
      {children}
    </Admonition>
  )
}

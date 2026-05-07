'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface HubSpotFormCreateConfig {
  portalId: string
  formId: string
  region?: string
  target: string
  cssClass?: string
  /** Replaces HubSpot's default form CSS (loaded into the iframe). */
  css?: string
  /** Required CSS that's always applied on top of `css`. Set to `''` to disable. */
  cssRequired?: string
}

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (config: HubSpotFormCreateConfig) => void
      }
    }
  }
}

const HUBSPOT_SCRIPT_SRC = 'https://js.hsforms.net/forms/embed/v2.js'

let scriptPromise: Promise<void> | null = null

function loadHubSpotScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('HubSpot script can only load in the browser'))
  }
  if (window.hbspt) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${HUBSPOT_SCRIPT_SRC}"]`
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('HubSpot script failed to load')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = HUBSPOT_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('HubSpot script failed to load'))
    document.body.appendChild(script)
  })

  // Reset the cached promise on failure so a retry can re-attempt the load.
  scriptPromise.catch(() => {
    scriptPromise = null
  })

  return scriptPromise
}

/**
 * The form renders inside a HubSpot-served iframe, so CSS variables defined
 * on the parent document don't reach it. We resolve the project's theme
 * tokens to literal HSL values at mount time and pass them inside a
 * complete stylesheet via the embed's `css` option.
 */
function buildThemedFormCss(): string {
  const root = document.documentElement
  const styles = getComputedStyle(root)
  const hsl = (name: string, fallback: string) => {
    const v = styles.getPropertyValue(name).trim()
    return v ? `hsl(${v})` : fallback
  }

  const fg = hsl('--foreground-default', '#fafafa')
  const fgLight = hsl('--foreground-light', '#b4b4b4')
  const fgLighter = hsl('--foreground-lighter', '#888888')
  const bg = hsl('--background-default', '#121212')
  const surface = hsl('--background-surface-100', '#1f1f1f')
  const border = hsl('--border-default', '#2e2e2e')
  const borderStronger = hsl('--border-stronger', '#454545')
  const destructive = hsl('--destructive-default', '#dc4b3e')
  const link = hsl('--brand-link', '#3ecf8e')

  return `
    .hbspt-form,
    .hs-form,
    .hs-form fieldset,
    fieldset { background: transparent !important; max-width: none !important; width: 100% !important; }
    .hs-form { color: ${fg}; font-family: inherit; }
    body, html { background: transparent !important; color: ${fg}; font-family: inherit; }

    fieldset.form-columns-1 .input,
    fieldset.form-columns-2 .input,
    fieldset.form-columns-3 .input { margin-right: 0 !important; }
    fieldset.form-columns-2 { display: grid !important; grid-template-columns: 1fr 1fr; gap: 1rem; }
    fieldset.form-columns-3 { display: grid !important; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
    fieldset.form-columns-2 .hs-form-field,
    fieldset.form-columns-3 .hs-form-field { width: 100% !important; float: none !important; padding: 0 !important; }

    .hs-form-field { margin-bottom: 1rem; }
    .hs-form-field > label,
    .hs-form-field legend {
      display: block;
      color: ${fg};
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    .hs-richtext, .hs-richtext * { color: ${fgLight}; font-size: 0.875rem; }
    .hs-richtext a { color: ${link}; text-decoration: underline; }
    .hs-form-required { color: ${destructive}; margin-left: 0.125rem; }
    .hs-field-desc { color: ${fgLighter}; font-size: 0.75rem; margin-top: 0.25rem; }

    input.hs-input:not([type='checkbox']):not([type='radio']):not([type='file']):not([type='submit']),
    select.hs-input,
    textarea.hs-input {
      display: block;
      width: 100% !important;
      background-color: ${surface};
      color: ${fg};
      border: 1px solid ${border};
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      line-height: 1.5;
      font-family: inherit;
      box-sizing: border-box;
    }
    select.hs-input { appearance: none; -webkit-appearance: none; }
    textarea.hs-input { min-height: 6rem; resize: vertical; }
    .hs-input::placeholder { color: ${fgLighter}; }
    .hs-input:hover { border-color: ${borderStronger}; }
    .hs-input:focus,
    .hs-input:focus-visible {
      outline: none;
      border-color: ${fg};
      box-shadow: 0 0 0 1px ${fg};
    }
    .hs-input.invalid, .hs-input.error { border-color: ${destructive}; }

    .hs-error-msgs { list-style: none; padding: 0; margin: 0.375rem 0 0; }
    .hs-error-msg, .hs-error-msgs label { color: ${destructive}; font-size: 0.75rem; }

    .legal-consent-container,
    .legal-consent-container * { color: ${fgLighter}; font-size: 0.75rem; line-height: 1.5; }
    .legal-consent-container a { color: ${link}; text-decoration: underline; }

    .hs-fieldtype-booleancheckbox ul.inputs-list,
    .hs-fieldtype-checkbox ul.inputs-list,
    .hs-fieldtype-radio ul.inputs-list { list-style: none; padding: 0; margin: 0; }
    .hs-fieldtype-booleancheckbox label,
    .hs-fieldtype-checkbox label,
    .hs-fieldtype-radio label {
      color: ${fgLight};
      font-weight: 400;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      cursor: pointer;
    }
    input[type='checkbox'].hs-input,
    input[type='radio'].hs-input {
      accent-color: ${fg};
      width: auto !important;
      margin-top: 0.25rem;
    }

    .hs_submit { margin-top: 1.25rem; }
    .actions { padding: 0 !important; }
    .hs-button.primary,
    input[type='submit'].hs-button {
      background-color: ${fg};
      color: ${bg};
      border: none;
      border-radius: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      transition: opacity 150ms ease;
      font-family: inherit;
    }
    .hs-button.primary:hover,
    input[type='submit'].hs-button:hover { opacity: 0.9; }
    .hs-button.primary:disabled,
    input[type='submit'].hs-button:disabled { opacity: 0.5; cursor: not-allowed; }

    .submitted-message { color: ${fg}; font-size: 0.875rem; }
  `
}

export interface HubSpotFormEmbedProps {
  /** HubSpot portal (hub) ID. */
  portalId: string
  /** HubSpot form GUID. */
  formId: string
  /**
   * HubSpot region — required for EU-hosted portals (e.g. `'eu1'`). Omit for
   * the default North America region.
   */
  region?: string
  /** Class name applied to the wrapper element. */
  className?: string
}

type LoadState = 'loading' | 'ready' | 'error'

/**
 * Embeds a HubSpot-hosted form by loading their `forms/embed/v2.js` script
 * and mounting the form into a container managed by this component. Use this
 * when the form is managed in HubSpot (e.g. with conditional fields, GDPR
 * notices, or workflow integrations) and you don't want to re-implement that
 * logic natively.
 *
 * The form renders inside a HubSpot iframe; we read the project's theme
 * tokens at mount time and inject a matching stylesheet so the iframe
 * follows the active light/dark theme.
 *
 * For native-rendered forms with multi-channel fan-out (HubSpot + Customer.io
 * + Notion), use `MarketingForm` instead.
 */
export default function HubSpotFormEmbed({
  portalId,
  formId,
  region,
  className,
}: HubSpotFormEmbedProps) {
  const targetId = `hubspot-form-${useId().replace(/:/g, '-')}`
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    let cancelled = false
    setState('loading')

    loadHubSpotScript()
      .then(() => {
        if (cancelled) return
        if (!window.hbspt || !containerRef.current) {
          setState('error')
          return
        }

        // Clear any previously rendered form (e.g. on prop change or remount).
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }

        window.hbspt.forms.create({
          portalId,
          formId,
          ...(region ? { region } : {}),
          target: `#${targetId}`,
          css: buildThemedFormCss(),
          cssRequired: '',
        })
        setState('ready')
      })
      .catch((error) => {
        if (cancelled) return
        console.error('[marketing/hubspot] Failed to initialize HubSpot form embed', error)
        setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [portalId, formId, region, targetId])

  return (
    <div className={className}>
      <div id={targetId} ref={containerRef} aria-busy={state === 'loading'} />

      {state === 'loading' && (
        <div className="flex flex-col gap-3 animate-pulse" role="status" aria-label="Loading form">
          <div className="h-10 rounded-md bg-surface-200" />
          <div className="h-10 rounded-md bg-surface-200" />
          <div className="h-10 rounded-md bg-surface-200" />
          <div className="h-24 rounded-md bg-surface-200" />
          <div className="h-10 rounded-md bg-surface-200 w-1/3" />
        </div>
      )}

      {state === 'error' && (
        <p className="text-sm text-foreground-light" role="alert">
          We couldn&apos;t load the form. Please refresh the page or try again later.
        </p>
      )}
    </div>
  )
}

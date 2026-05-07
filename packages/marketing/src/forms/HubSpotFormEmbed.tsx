'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface HubSpotFormCreateConfig {
  portalId: string
  formId: string
  region?: string
  target: string
  cssClass?: string
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
    <div className={`hubspot-form-themed ${className ?? ''}`}>
      <HubSpotFormThemeStyles />

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

/**
 * Scoped overrides that re-skin HubSpot's default form CSS using the project's
 * theme tokens. HubSpot ships its own stylesheet alongside the embed script;
 * these rules sit on top so the form follows light/dark theme automatically.
 */
function HubSpotFormThemeStyles() {
  return (
    <style>{`
      .hubspot-form-themed .hbspt-form,
      .hubspot-form-themed .hs-form,
      .hubspot-form-themed .hs-form fieldset {
        background: transparent;
        max-width: none;
      }
      .hubspot-form-themed .hs-richtext,
      .hubspot-form-themed .hs-richtext * {
        color: hsl(var(--foreground-light));
      }
      .hubspot-form-themed .hs-form-field > label,
      .hubspot-form-themed .hs-form-field legend {
        color: hsl(var(--foreground-default));
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
      .hubspot-form-themed .hs-form-required {
        color: hsl(var(--destructive-default));
        margin-left: 0.125rem;
      }
      .hubspot-form-themed .hs-input:not([type='checkbox']):not([type='radio']):not([type='file']):not([type='submit']) {
        background-color: hsl(var(--background-surface-100));
        color: hsl(var(--foreground-default));
        border: 1px solid hsl(var(--border-default));
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.5;
        width: 100%;
      }
      .hubspot-form-themed select.hs-input {
        appearance: none;
      }
      .hubspot-form-themed .hs-input::placeholder {
        color: hsl(var(--foreground-lighter));
      }
      .hubspot-form-themed .hs-input:focus,
      .hubspot-form-themed .hs-input:focus-visible {
        outline: none;
        border-color: hsl(var(--foreground-default));
        box-shadow: 0 0 0 1px hsl(var(--foreground-default));
      }
      .hubspot-form-themed .hs-input.invalid,
      .hubspot-form-themed .hs-input.error {
        border-color: hsl(var(--destructive-default));
      }
      .hubspot-form-themed .hs-error-msgs {
        list-style: none;
        padding: 0;
        margin: 0.375rem 0 0;
      }
      .hubspot-form-themed .hs-error-msg,
      .hubspot-form-themed .hs-error-msgs label {
        color: hsl(var(--destructive-default));
        font-size: 0.75rem;
      }
      .hubspot-form-themed .legal-consent-container,
      .hubspot-form-themed .legal-consent-container * {
        color: hsl(var(--foreground-lighter));
        font-size: 0.75rem;
        line-height: 1.5;
      }
      .hubspot-form-themed .legal-consent-container a {
        color: hsl(var(--brand-link));
        text-decoration: underline;
      }
      .hubspot-form-themed .hs-form-field {
        margin-bottom: 1rem;
      }
      .hubspot-form-themed .input {
        margin-right: 0;
      }
      .hubspot-form-themed .hs-button.primary,
      .hubspot-form-themed input[type='submit'].hs-button {
        background-color: hsl(var(--foreground-default));
        color: hsl(var(--background-default));
        border: none;
        border-radius: 0.5rem;
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        width: 100%;
        transition: opacity 150ms ease;
      }
      .hubspot-form-themed .hs-button.primary:hover,
      .hubspot-form-themed input[type='submit'].hs-button:hover {
        opacity: 0.9;
      }
      .hubspot-form-themed .hs-button.primary:disabled,
      .hubspot-form-themed input[type='submit'].hs-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .hubspot-form-themed .hs-fieldtype-booleancheckbox label,
      .hubspot-form-themed .hs-fieldtype-checkbox label {
        color: hsl(var(--foreground-light));
        font-weight: 400;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .hubspot-form-themed input[type='checkbox'].hs-input,
      .hubspot-form-themed input[type='radio'].hs-input {
        accent-color: hsl(var(--foreground-default));
      }
      .hubspot-form-themed .submitted-message {
        color: hsl(var(--foreground-default));
      }
    `}</style>
  )
}

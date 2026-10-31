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
 * Note: HubSpot renders the form inside a same-origin iframe styled by their
 * own stylesheet. The iframe's appearance is driven by the form's settings in
 * HubSpot — adjust visual styling there.
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
    <div className={className}>
      <div id={targetId} ref={containerRef} aria-busy={state === 'loading'} />

      {state === 'loading' && (
        <div
          className="flex flex-col gap-3 animate-pulse p-6 sm:p-8"
          role="status"
          aria-label="Loading form"
        >
          <div className="h-10 rounded-md bg-surface-200" />
          <div className="h-10 rounded-md bg-surface-200" />
          <div className="h-10 rounded-md bg-surface-200" />
          <div className="h-24 rounded-md bg-surface-200" />
          <div className="h-10 rounded-md bg-surface-200 w-1/3" />
        </div>
      )}

      {state === 'error' && (
        <p className="text-sm text-foreground-light p-6 sm:p-8" role="alert">
          We couldn&apos;t load the form. Please refresh the page or try again later.
        </p>
      )}
    </div>
  )
}

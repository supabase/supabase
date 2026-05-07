'use client'

import { useEffect, useId } from 'react'

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (config: { portalId: string; formId: string; target: string }) => void
      }
    }
  }
}

const HUBSPOT_SCRIPT_SRC = 'https://js.hsforms.net/forms/embed/v2.js'

function loadHubSpotScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.hbspt) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${HUBSPOT_SCRIPT_SRC}"]`
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load HubSpot form script')),
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.src = HUBSPOT_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load HubSpot form script'))
    document.body.appendChild(script)
  })
}

export interface HubSpotFormEmbedProps {
  portalId: string
  formId: string
}

/**
 * Embeds a HubSpot-hosted form by loading their `forms/embed/v2.js` script and
 * mounting the form into a unique container. Use this when the form is managed
 * in HubSpot (e.g. with conditional fields or workflow integrations) and you
 * don't want to re-implement that logic natively.
 *
 * For native-rendered forms with multi-channel fan-out, use `MarketingForm`.
 */
export default function HubSpotFormEmbed({ portalId, formId }: HubSpotFormEmbedProps) {
  const targetId = `hubspot-form-${useId().replace(/:/g, '-')}`

  useEffect(() => {
    let cancelled = false

    const mountForm = async () => {
      try {
        await loadHubSpotScript()
        if (cancelled || !window.hbspt) return

        const target = document.getElementById(targetId)
        if (!target) return

        while (target.firstChild) {
          target.removeChild(target.firstChild)
        }

        window.hbspt.forms.create({
          portalId,
          formId,
          target: `#${targetId}`,
        })
      } catch (error) {
        console.error('[marketing/hubspot] Failed to initialize HubSpot form embed', error)
      }
    }

    mountForm()

    return () => {
      cancelled = true
    }
  }, [formId, portalId, targetId])

  return <div id={targetId} />
}

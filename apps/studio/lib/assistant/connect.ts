import { gotrueClient } from 'common'
import { z } from 'zod'

import { getAssistantOAuthStartUrl } from './backend'
import { getAssistantRequestHeaders } from './client'
import { assistantApiOrigin, readAssistantOAuthCode } from './oauth'
import { assistantFetch } from '@/data/ai-assistant/fetcher'

const startSchema = z.object({ state: z.string(), authorize_url: z.string().url() })

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Opens during the click gesture. Only this window retains the PKCE verifier. */
export async function connectAssistantOrganization(
  orgSlug: string,
  returnTo: string,
  signal: AbortSignal
) {
  const popup = window.open('about:blank', '_blank', 'popup,width=600,height=800')
  if (!popup) throw new Error("Couldn't open the connection window. Allow popups and try again.")
  let dispose = () => {}
  try {
    const {
      data: { session },
    } = await gotrueClient.getSession()
    if (!session) throw new Error('Not signed in')
    const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
    const challenge = base64url(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
    )
    const startUrl = getAssistantOAuthStartUrl(orgSlug, returnTo)
    if (!startUrl) throw new Error('Assistant backend is not configured')
    const url = new URL(startUrl)
    url.searchParams.set('code_challenge', challenge)
    const response = await fetch(url, { headers: await getAssistantRequestHeaders(), signal })
    if (!response.ok) throw new Error("Couldn't start the connection. Try again.")
    const started = startSchema.parse(await response.json())
    signal.throwIfAborted()
    const received = new Promise<string>((resolve, reject) => {
      const onMessage = (event: MessageEvent) => {
        const code = readAssistantOAuthCode(event, {
          origin: assistantApiOrigin(),
          popup,
          state: started.state,
        })
        if (code) resolve(code)
      }
      const onAbort = () => reject(new Error('Connection canceled'))
      const interval = setInterval(() => {
        if (popup.closed) reject(new Error('Connection window closed'))
      }, 1000)
      const timeout = setTimeout(
        () => reject(new Error('Connection request expired. Try again.')),
        15 * 60_000
      )
      window.addEventListener('message', onMessage)
      signal.addEventListener('abort', onAbort, { once: true })
      dispose = () => {
        clearInterval(interval)
        clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        signal.removeEventListener('abort', onAbort)
      }
    })
    popup.location.href = started.authorize_url
    const code = await received
    dispose()
    if ((await gotrueClient.getSession()).data.session?.user.id !== session.user.id) {
      throw new Error('Your account changed. Start the connection again.')
    }
    await assistantFetch('/oauth/complete', {
      method: 'POST',
      signal,
      body: JSON.stringify({ state: started.state, code, code_verifier: verifier }),
    })
  } finally {
    dispose()
    popup.close()
  }
}

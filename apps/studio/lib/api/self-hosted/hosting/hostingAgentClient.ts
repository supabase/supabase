import type { Site } from './types'

/**
 * Thin HTTP client for the hosting agent sidecar. The agent owns the privileged
 * nginx operations (writing server blocks, reloading); Studio only describes the
 * desired state and lets the agent apply it.
 */
export class HostingAgentClient {
  constructor(
    private baseUrl: string,
    private token: string
  ) {}

  private async post(pathname: string, body?: unknown): Promise<void> {
    const response = await fetch(`${this.baseUrl}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (!response.ok) {
      let message = `Hosting agent request failed (status ${response.status})`
      try {
        const data = await response.json()
        if (data?.error) message = String(data.error)
      } catch {
        // keep the default message
      }
      throw new Error(message)
    }
  }

  /** Writes/updates the site's nginx server block and reloads nginx. */
  applySite(site: Pick<Site, 'slug' | 'domain' | 'docroot' | 'spaFallback' | 'tls' | 'apiProxy'>) {
    return this.post('/sites/apply', site)
  }

  /** Removes the site's nginx server block and reloads nginx. */
  removeSite(slug: string) {
    return this.post('/sites/remove', { slug })
  }

  reload() {
    return this.post('/reload')
  }
}

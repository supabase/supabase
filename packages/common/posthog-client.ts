import posthog from 'posthog-js'
import { PostHogConfig } from 'posthog-js'

interface PostHogClientConfig {
  apiKey?: string
  apiHost?: string
}

class PostHogClient {
  private initialized = false
  private pendingGroups: Record<string, string> = {}
  private pendingIdentification: { userId: string; properties?: Record<string, any> } | null = null
  private config: PostHogClientConfig

  constructor(config: PostHogClientConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiHost:
        config.apiHost || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://ph.supabase.green',
    }
  }

  init(hasConsent: boolean = true) {
    if (this.initialized || typeof window === 'undefined' || !hasConsent) return

    if (!this.config.apiKey) {
      console.warn('PostHog API key not found. Skipping initialization.')
      return
    }

    const config: Partial<PostHogConfig> = {
      api_host: this.config.apiHost,
      autocapture: false, // We'll manually track events
      capture_pageview: false, // We'll manually track pageviews
      capture_pageleave: false, // We'll manually track page leaves
      loaded: (posthog) => {
        // Apply any pending groups
        Object.entries(this.pendingGroups).forEach(([type, id]) => {
          posthog.group(type, id)
        })
        this.pendingGroups = {}

        // Apply any pending identification
        if (this.pendingIdentification) {
          posthog.identify(this.pendingIdentification.userId, this.pendingIdentification.properties)
          this.pendingIdentification = null
        }
      },
    }

    posthog.init(this.config.apiKey, config)
    this.initialized = true
  }

  capturePageView(properties: Record<string, any>, hasConsent: boolean = true) {
    if (!hasConsent || !this.initialized) return

    // Store groups from properties if present (for later group() calls)
    if (properties.$groups) {
      Object.entries(properties.$groups).forEach(([type, id]) => {
        if (id) posthog.group(type, id as string)
      })
    }

    posthog.capture('$pageview', properties)
  }

  capturePageLeave(properties: Record<string, any>, hasConsent: boolean = true) {
    if (!hasConsent || !this.initialized) return
    posthog.capture('$pageleave', properties)
  }

  identify(userId: string, properties?: Record<string, any>, hasConsent: boolean = true) {
    if (!hasConsent) return

    if (!this.initialized) {
      // Queue the identification for when PostHog initializes
      this.pendingIdentification = { userId, properties }
      return
    }

    posthog.identify(userId, properties)
  }
}

export const posthogClient = new PostHogClient()

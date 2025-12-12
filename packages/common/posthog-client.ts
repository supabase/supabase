import posthog from 'posthog-js'
import { PostHogConfig } from 'posthog-js'

// Limit the max number of queued events
// (e.g. if a user navigates around a lot before accepting consent)
const MAX_PENDING_EVENTS = 20

interface PostHogClientConfig {
  apiKey?: string
  apiHost?: string
}

class PostHogClient {
  /** True after posthog.init() is called (prevents double-init) */
  private initStarted = false
  /** True after the `loaded` callback fires, meaning PostHog has fully bootstrapped */
  private initialized = false
  private pendingGroups: Record<string, string> = {}
  private pendingIdentification: { userId: string; properties?: Record<string, any> } | null = null
  private pendingEvents: Array<{ event: string; properties: Record<string, any> }> = []
  private config: PostHogClientConfig
  private readonly maxPendingEvents = MAX_PENDING_EVENTS

  constructor(config: PostHogClientConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiHost:
        config.apiHost || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://ph.supabase.green',
    }
  }

  init(hasConsent: boolean = true) {
    if (this.initStarted || typeof window === 'undefined' || !hasConsent) return

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
        // Apply pending properties that were set before PostHog
        // initialized due to poor connection or user not accepting
        // consent right away

        // Apply any pending groups
        Object.entries(this.pendingGroups).forEach(([type, id]) => {
          posthog.group(type, id)
        })
        this.pendingGroups = {}

        // Apply any pending identification
        if (this.pendingIdentification) {
          try {
            posthog.identify(
              this.pendingIdentification.userId,
              this.pendingIdentification.properties
            )
          } catch (error) {
            console.error('PostHog identify failed:', error)
          }
          this.pendingIdentification = null
        }

        // Flush any pending events
        this.pendingEvents.forEach(({ event, properties }) => {
          try {
            posthog.capture(event, properties, { transport: 'sendBeacon' })
          } catch (error) {
            console.error('PostHog capture failed:', error)
          }
        })
        this.pendingEvents = []

        // Mark as fully initialized now that PostHog has bootstrapped
        this.initialized = true
      },
    }

    this.initStarted = true
    posthog.init(this.config.apiKey, config)
  }

  capturePageView(properties: Record<string, any>, hasConsent: boolean = true) {
    if (!hasConsent) return

    if (!this.initialized) {
      // Queue the event for when PostHog initializes (up to cap)
      // (e.g. poor connection or user not accepting consent right away)
      if (this.pendingEvents.length >= this.maxPendingEvents) {
        this.pendingEvents.shift() // Remove oldest event
      }
      this.pendingEvents.push({ event: '$pageview', properties })
      return
    }

    try {
      // Store groups from properties if present (for later group() calls)
      if (properties.$groups) {
        Object.entries(properties.$groups).forEach(([type, id]) => {
          if (id) posthog.group(type, id as string)
        })
      }

      posthog.capture('$pageview', properties, { transport: 'sendBeacon' })
    } catch (error) {
      console.error('PostHog pageview capture failed:', error)
    }
  }

  capturePageLeave(properties: Record<string, any>, hasConsent: boolean = true) {
    if (!hasConsent) return

    if (!this.initialized) {
      // Queue the event for when PostHog initializes (up to cap)
      // (e.g. poor connection or user not accepting consent right away)
      if (this.pendingEvents.length >= this.maxPendingEvents) {
        this.pendingEvents.shift() // Remove oldest event
      }
      this.pendingEvents.push({ event: '$pageleave', properties })
      return
    }

    try {
      // Use sendBeacon for page leave to survive tab close
      posthog.capture('$pageleave', properties, { transport: 'sendBeacon' })
    } catch (error) {
      console.error('PostHog pageleave capture failed:', error)
    }
  }

  identify(userId: string, properties?: Record<string, any>, hasConsent: boolean = true) {
    if (!hasConsent) return

    if (!this.initialized) {
      // Queue the identification for when PostHog initializes
      this.pendingIdentification = { userId, properties }
      return
    }

    try {
      posthog.identify(userId, properties)
    } catch (error) {
      console.error('PostHog identify failed:', error)
    }
  }

  reset() {
    this.pendingIdentification = null
    this.pendingGroups = {}
    this.pendingEvents = []

    if (!this.initStarted) return

    try {
      posthog.reset()
    } catch (error) {
      console.error('PostHog reset failed:', error)
    }
  }

  /**
   * Returns the current PostHog distinct_id for the user.
   * This is the anonymous ID that PostHog uses to track the user before they are identified,
   * and contains all first-touch attribution data ($initial_referrer, $initial_utm_source, etc.).
   *
   * We need to pass this to the backend identify endpoint so that the backend's alias() call
   * uses the correct anonymous ID to link the anonymous profile to the authenticated user.
   *
   * Returns undefined if PostHog hasn't fully bootstrapped yet (i.e., before the `loaded`
   * callback fires). This avoids a race condition where get_distinct_id() might return
   * undefined during the async initialization window.
   */
  getDistinctId(): string | undefined {
    if (!this.initialized) return undefined

    try {
      return posthog.get_distinct_id()
    } catch (error) {
      console.error('PostHog getDistinctId failed:', error)
      return undefined
    }
  }
}

export const posthogClient = new PostHogClient()

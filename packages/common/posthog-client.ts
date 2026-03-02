import posthog, { PostHogConfig } from 'posthog-js'

// Limit the max number of queued events
// (e.g. if a user navigates around a lot before accepting consent)
const MAX_PENDING_EVENTS = 20

export interface ClientTelemetryEvent {
  id: string
  timestamp: number
  eventType: 'capture' | 'identify' | 'pageview' | 'pageleave'
  eventName: string
  distinctId?: string
  properties?: Record<string, unknown>
}

type ClientTelemetryListener = (event: ClientTelemetryEvent) => void

interface PostHogClientConfig {
  apiKey?: string
  apiHost?: string
  uiHost?: string
}

class PostHogClient {
  /** True after posthog.init() is called (prevents double-init) */
  private initStarted = false
  /** True after the `loaded` callback fires, meaning PostHog has fully bootstrapped */
  private initialized = false
  private pendingGroups: Record<string, string> = {}
  private pendingIdentification: { userId: string; properties?: Record<string, any> } | null = null
  private pendingEvents: Array<{ event: string; properties: Record<string, any> }> = []
  private pendingExposures: Array<{ experimentId: string; properties: Record<string, any> }> = []
  private config: PostHogClientConfig
  private readonly maxPendingEvents = MAX_PENDING_EVENTS
  private devListeners: Set<ClientTelemetryListener> = new Set()

  constructor(config: PostHogClientConfig = {}) {
    const apiHost =
      config.apiHost || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://ph.supabase.green'
    const uiHost =
      config.uiHost || process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com'

    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiHost,
      uiHost,
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
      ui_host: this.config.uiHost,
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

        this.initialized = true

        // Flush any pending experiment exposures (with deduplication)
        this.pendingExposures.forEach(({ experimentId, properties }) => {
          this.fireExposureIfNew(experimentId, properties)
        })
        this.pendingExposures = []
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

      this.emitToDevListeners('pageview', '$pageview', properties)
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

      this.emitToDevListeners('pageleave', '$pageleave', properties)
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

      this.emitToDevListeners('identify', '$identify', { userId, ...properties })
    } catch (error) {
      console.error('PostHog identify failed:', error)
    }
  }

  reset() {
    this.pendingIdentification = null
    this.pendingGroups = {}
    this.pendingEvents = []
    this.pendingExposures = []

    if (!this.initStarted) return

    try {
      posthog.reset()
    } catch (error) {
      console.error('PostHog reset failed:', error)
    }
  }

  /**
   * Returns PostHog's distinct_id, which holds first-touch attribution data.
   * Falls back to reading from PostHog cookie if SDK isn't initialized yet
   * (e.g., immediately after OAuth redirect before PostHog loads).
   */
  getDistinctId(): string | undefined {
    if (this.initialized) {
      try {
        return posthog.get_distinct_id()
      } catch (error) {
        console.error('PostHog getDistinctId failed:', error)
      }
    }

    // Fallback: parse distinct_id from PostHog cookie
    return this.getDistinctIdFromCookie()
  }

  /**
   * Parse distinct_id from PostHog cookie.
   * PostHog stores data in a cookie named `ph_<api_key>_posthog` with format:
   * { distinct_id: "...", ... }
   */
  private getDistinctIdFromCookie(): string | undefined {
    if (typeof document === 'undefined') return undefined

    try {
      const cookieName = `ph_${this.config.apiKey}_posthog`
      const cookies = document.cookie.split(';')

      for (const cookie of cookies) {
        const trimmed = cookie.trim()
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex === -1) continue

        const name = trimmed.substring(0, eqIndex)
        if (name !== cookieName) continue

        // Use substring instead of split to handle '=' chars in the value
        const cookieValue = decodeURIComponent(trimmed.substring(eqIndex + 1))
        const phData = JSON.parse(cookieValue)

        if (phData.distinct_id && typeof phData.distinct_id === 'string') {
          return phData.distinct_id
        }
      }
    } catch {
      // No op, cookie may not exist (first visit) or be malformed
    }

    return undefined
  }

  /**
   * Returns PostHog's session_id for the current session.
   * Returns undefined until PostHog's `loaded` callback fires.
   */
  getSessionId(): string | undefined {
    if (!this.initialized) return undefined

    try {
      return posthog.get_session_id()
    } catch (error) {
      console.error('PostHog getSessionId failed:', error)
      return undefined
    }
  }

  /**
   * Captures an experiment exposure event with session-based deduplication.
   * Events are queued if PostHog is not yet initialized, then deduped on flush.
   */
  captureExperimentExposure(
    experimentId: string,
    properties: Record<string, any>,
    hasConsent: boolean = true
  ) {
    if (!hasConsent) return

    if (!this.initialized) {
      // Only queue if not already queued for this experiment (first exposure wins)
      if (!this.pendingExposures.some((e) => e.experimentId === experimentId)) {
        if (this.pendingExposures.length >= this.maxPendingEvents) {
          this.pendingExposures.shift()
        }
        this.pendingExposures.push({ experimentId, properties })
      }
      return
    }

    this.fireExposureIfNew(experimentId, properties)
  }

  private fireExposureIfNew(experimentId: string, properties: Record<string, any>) {
    const sessionId = this.getSessionId()
    if (!sessionId) return

    const storageKey = `ph_exposed:${experimentId}`

    try {
      if (sessionStorage.getItem(storageKey) === sessionId) return

      const eventName = `${experimentId}_experiment_exposed`
      posthog.capture(eventName, { experiment_id: experimentId, ...properties })
      sessionStorage.setItem(storageKey, sessionId)
    } catch (error) {
      console.error('PostHog experiment exposure capture failed:', error)
    }
  }

  subscribeToEvents(listener: ClientTelemetryListener): () => void {
    this.devListeners.add(listener)
    return () => this.devListeners.delete(listener)
  }

  private emitToDevListeners(
    eventType: ClientTelemetryEvent['eventType'],
    eventName: string,
    properties?: Record<string, unknown>
  ) {
    if (this.devListeners.size === 0) return

    let distinctId: string | undefined
    try {
      const id = posthog.get_distinct_id?.()
      if (id && id.length > 0) {
        distinctId = id
      }
    } catch {}

    const event: ClientTelemetryEvent = {
      id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      eventType,
      eventName,
      distinctId,
      properties,
    }

    this.devListeners.forEach((listener) => {
      try {
        listener(event)
      } catch (e) {
        console.error('Dev telemetry listener error:', e)
      }
    })
  }
}

export const posthogClient = new PostHogClient()

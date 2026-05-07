import type { Dispatch, SetStateAction } from 'react'

export interface DevTelemetryEvent {
  id: string
  timestamp: number
  source: 'client' | 'server'
  eventType: string
  eventName: string
  distinctId?: string
  properties?: Record<string, unknown>
}

export interface ServerTelemetryEvent {
  id: string
  timestamp: number
  sessionId: string
  eventType: 'capture' | 'identify' | 'groupIdentify' | 'alias'
  eventName: string
  distinctId: string
  properties?: Record<string, unknown>
  groups?: Record<string, string | number>
}

export interface DevToolbarConfig {
  apiUrl: string
}

export interface DevTelemetryToolbarContextType {
  isEnabled: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  events: DevTelemetryEvent[]
  setEvents: Dispatch<SetStateAction<DevTelemetryEvent[]>>
  dismissToolbar: () => void
}

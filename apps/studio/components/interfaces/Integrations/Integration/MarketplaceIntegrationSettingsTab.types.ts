import { type ReactNode } from 'react'

import {
  type ConnectedResource,
  type ConnectedResourceKind,
} from '@/components/interfaces/Integrations/Landing/Landing.utils'

export type ResourceKind = ConnectedResourceKind

export type ApiKeyResource = Extract<ConnectedResource, { kind: 'api_key' }>

export type ManageAction = { label: string; href: string }

/** A single removable entry within a section (one OAuth app, one API key, one secret, etc.). */
export type ResourceItem = { resource: ConnectedResource; identifier: string; meta?: string }

/** A group of same-kind resources rendered as one section (e.g. all secret API keys together). */
export type ResourceGroup = {
  kind: ResourceKind
  title: string
  badge?: string
  description: ReactNode
  note: string
  /** Impact copy shown in the zero state when the resource is expected but absent. */
  missingNote: string
  manageAction?: ManageAction
  items: ResourceItem[]
  /** True when the integration expects this resource but none is currently connected. */
  missing?: boolean
}

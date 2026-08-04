import type { ReactNode } from 'react'

import { TAB_KIND_ICONS } from './kinds.icons'
import type { Tab } from '@/state/tabs'

/** Which tab strip / layout a kind renders in — strip filtering, bulk-close, and recents key off this instead of an id-prefix check. */
export type TabSurface = 'sql' | 'table'

/** `sql` covers both Postgres and logs snippets; `Tab.metadata.sqlSource` discriminates */
export type TabKind = 'sql' | 'notebook' | 'chat' | 'r' | 'v' | 'm' | 'f' | 'p'

interface TabKindDescriptor {
  surface: TabSurface
  /** URL segment prefix. `null` = bare segment — `sql` (legacy) and every table kind, since `/editor/<id>` is already bare and unprefixed today. */
  urlPrefix: string | null
  /** Singular noun for shared copy, e.g. a not-found message: "This <noun> could not be found." */
  noun: string
  supportsPreview: boolean
  Icon: (props: { tab: Tab }) => ReactNode
}

export const TAB_KINDS: Record<TabKind, TabKindDescriptor> = {
  sql: {
    surface: 'sql',
    urlPrefix: null,
    noun: 'query',
    supportsPreview: true,
    Icon: TAB_KIND_ICONS.sql,
  },
  notebook: {
    surface: 'sql',
    urlPrefix: 'notebook',
    noun: 'notebook',
    supportsPreview: true,
    Icon: TAB_KIND_ICONS.notebook,
  },
  chat: {
    surface: 'sql',
    urlPrefix: 'chat',
    noun: 'chat',
    supportsPreview: true,
    Icon: TAB_KIND_ICONS.chat,
  },
  r: {
    surface: 'table',
    urlPrefix: null,
    noun: 'table',
    supportsPreview: true,
    Icon: TAB_KIND_ICONS.r,
  },
  v: {
    surface: 'table',
    urlPrefix: null,
    noun: 'view',
    supportsPreview: true,
    Icon: TAB_KIND_ICONS.v,
  },
  m: {
    surface: 'table',
    urlPrefix: null,
    noun: 'materialized view',
    supportsPreview: true,
    Icon: TAB_KIND_ICONS.m,
  },
  f: {
    surface: 'table',
    urlPrefix: null,
    noun: 'foreign table',
    supportsPreview: true,
    Icon: TAB_KIND_ICONS.f,
  },
  p: {
    surface: 'table',
    urlPrefix: null,
    noun: 'partitioned table',
    supportsPreview: true,
    Icon: TAB_KIND_ICONS.p,
  },
}

export const isTabKind = (value: string): value is TabKind =>
  Object.prototype.hasOwnProperty.call(TAB_KINDS, value)

const TAB_KIND_LIST = Object.keys(TAB_KINDS).filter(isTabKind)

export const surfaceOf = (kind: TabKind): TabSurface => TAB_KINDS[kind].surface

export const kindsOnSurface = (surface: TabSurface): Array<TabKind> =>
  TAB_KIND_LIST.filter((kind) => TAB_KINDS[kind].surface === surface)

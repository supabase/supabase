import { BASE_PATH } from 'lib/constants'
import { PROVIDER_PHONE, PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
import { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'

export type Filter = 'all' | 'verified' | 'unverified' | 'anonymous'

export type SpecificFilterColumn = OptimizedSearchColumns | 'name' | 'freeform'

export const UUIDV4_LEFT_PREFIX_REGEX =
  /^(?:[0-9a-f]{1,8}|[0-9a-f]{8}-|[0-9a-f]{8}-[0-9a-f]{1,4}|[0-9a-f]{8}-[0-9a-f]{4}-|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{0,3}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{0,3}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{0,12})$/i

export const PHONE_NUMBER_LEFT_PREFIX_REGEX = /^[+]?[0-9]{0,15}$/

export const PANEL_PADDING = 'px-5 py-5'

// [Joshen] Temporary fix as bulk delete will fire n requests since Auth + API do not have a bulk delete endpoint yet
export const MAX_BULK_DELETE = 20

export const PROVIDER_FILTER_OPTIONS = PROVIDERS_SCHEMAS.map((provider) => ({
  name: provider.title,
  value: 'key' in provider ? provider.key : provider.title.toLowerCase(),
  icon: `${BASE_PATH}/img/icons/${provider.misc.iconKey}.svg`,
  iconClass: provider.title === 'GitHub' ? 'dark:invert' : '',
})).concat(
  PROVIDER_PHONE.properties.SMS_PROVIDER.enum.map((x) => ({
    name: x.label,
    value: x.value,
    icon: `${BASE_PATH}/img/icons/${x.icon}`,
    iconClass: '',
  }))
)

export type UsersTableColumn = {
  id: string
  name: string
  minWidth?: number
  width?: number
  resizable?: boolean
}
export type ColumnConfiguration = { id: string; width?: number }
export const USERS_TABLE_COLUMNS: UsersTableColumn[] = [
  { id: 'img', name: '', minWidth: 95, width: 95, resizable: false },
  { id: 'id', name: 'UID', width: 280 },
  { id: 'name', name: 'Display name', minWidth: 0, width: 150 },
  { id: 'email', name: 'Email', width: 300 },
  { id: 'phone', name: 'Phone' },
  { id: 'providers', name: 'Providers', minWidth: 150 },
  { id: 'provider_type', name: 'Provider type', minWidth: 150 },
  { id: 'created_at', name: 'Created at', width: 260 },
  { id: 'last_sign_in_at', name: 'Last sign in at', width: 260 },
]

import type { DeepReadonly } from './type-helpers'
import type { TablePrivilegesGrant } from '@/data/privileges/table-privileges-grant-mutation'

export const API_ACCESS_ROLES = ['anon', 'authenticated', 'service_role'] as const
export type ApiAccessRole = (typeof API_ACCESS_ROLES)[number]

export const isApiAccessRole = (value: string): value is ApiAccessRole => {
  return API_ACCESS_ROLES.includes(value as ApiAccessRole)
}

export type ApiPrivilegeType = Extract<
  TablePrivilegesGrant['privilegeType'],
  'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
>
export const API_PRIVILEGE_TYPES = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
] as const satisfies readonly ApiPrivilegeType[]

export const isApiPrivilegeType = (value: string): value is ApiPrivilegeType => {
  return API_PRIVILEGE_TYPES.includes(value as ApiPrivilegeType)
}

export type ApiPrivilegesByRole = Record<ApiAccessRole, ApiPrivilegeType[]>

export const DEFAULT_DATA_API_PRIVILEGES: DeepReadonly<ApiPrivilegesByRole> = {
  anon: [...API_PRIVILEGE_TYPES],
  authenticated: [...API_PRIVILEGE_TYPES],
  service_role: [...API_PRIVILEGE_TYPES],
}

export const EMPTY_DATA_API_PRIVILEGES: DeepReadonly<ApiPrivilegesByRole> = {
  anon: [],
  authenticated: [],
  service_role: [],
}

export const checkDataApiPrivilegesNonEmpty = (
  privileges: DeepReadonly<ApiPrivilegesByRole> | undefined
): boolean => {
  if (!privileges) return false
  return Object.values(privileges).some((privs) => privs.length > 0)
}

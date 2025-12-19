import type { TablePrivilegesGrant } from 'data/privileges/table-privileges-grant-mutation'

export const API_ACCESS_ROLES = ['anon', 'authenticated'] as const
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

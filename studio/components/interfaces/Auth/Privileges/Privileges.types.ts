import { components } from 'data/api'

export type PrivilegesDataUI = {
  schema: string
  table: string
  role: string
  columns: PrivilegeColumnUI[]
}

export type PrivilegeColumnUI = {
  id: string
  name: string
  privileges: string[]
}

export type TablePrivilegesUI = components['schemas']['TablePrivilege']

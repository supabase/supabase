import type { TablePrivilegesGrant } from 'data/privileges/table-privileges-grant-mutation'
import type { Dictionary } from 'types'
import type { ColumnField } from '../SidePanelEditor.types'

export type ApiPrivilegeType = TablePrivilegesGrant['privilegeType']

export type ApiAccessRole = 'anon' | 'authenticated'

export const API_ACCESS_ROLES: ApiAccessRole[] = ['anon', 'authenticated']

export const API_PRIVILEGE_TYPES: ApiPrivilegeType[] = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

export type ApiPrivilegesPerRole = {
  anon: ApiPrivilegeType[]
  authenticated: ApiPrivilegeType[]
}

export interface TableField {
  id: number
  name: string
  comment?: string | null
  columns: ColumnField[]
  isRLSEnabled: boolean
  isRealtimeEnabled: boolean
  apiPrivileges?: ApiPrivilegesPerRole
}

export interface ImportContent {
  file?: File
  headers: string[]
  rowCount: number
  rows: object[]
  columnTypeMap: Dictionary<any>
  selectedHeaders: string[]
  resolve: () => void
}

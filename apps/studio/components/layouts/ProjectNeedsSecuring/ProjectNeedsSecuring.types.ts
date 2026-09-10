export type ProjectSecurityActionType =
  | 'ask_assistant'
  | 'copy_prompt'
  | 'skip_to_home'
  | 'view_policies'

export type ProjectSecurityActionDetails = {
  schema?: string
  tableName?: string
}

export type ProjectSecurityTable = {
  id: number
  name: string
  schema: string
  rlsEnabled: boolean
  dataApiAccessible: boolean
  hasRlsIssue: boolean
}

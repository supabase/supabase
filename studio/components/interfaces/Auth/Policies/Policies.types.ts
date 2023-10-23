export interface PolicyFormField {
  id?: number
  name: string
  schema: string
  table: string
  table_id?: number
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL' | null
  check: string | null
  definition: string | null
  roles: string[]
}

export interface PolicyForReview {
  description?: string
  statement?: string
}

export interface PostgresPolicyCreatePayload {
  name: string
  table: string
  schema?: string
  definition?: string
  check?: string
  action?: 'PERMISSIVE' | 'RESTRICTIVE'
  command?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles?: string[]
}

export interface PostgresPolicyUpdatePayload {
  id: number
  name?: string
  definition?: string
  check?: string
  roles?: string[]
}

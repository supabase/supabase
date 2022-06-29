export interface PolicyTemplate {
  id: string
  templateName: string
  description: string
  name: string
  statement: string
  definition: string
  check: string
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles: string[]
}

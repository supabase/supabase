export interface SQLTemplate {
  id: number
  type: 'template' | 'quickstart'
  title: string
  description: string
  sql: string
}

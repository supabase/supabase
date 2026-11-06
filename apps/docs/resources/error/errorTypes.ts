export interface ErrorCodeDefinition {
  description: string
  resolution?: string
  references?: Array<{ href: string; description: string }>
}

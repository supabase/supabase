import { RegistryItem } from 'shadcn/schema'

export interface OpenAPISchema {
  definitions?: Record<string, OpenAPIDefinition>
}

export interface OpenAPIDefinition {
  type: string
  properties?: Record<string, OpenAPIProperty>
  required?: string[]
}

export interface OpenAPIProperty {
  type?: string
  format?: string
  description?: string
  default?: unknown
  maxLength?: number
  enum?: string[]
  items?: { type?: string; format?: string }
}

export type RegistryFile = NonNullable<RegistryItem['files']>[number]

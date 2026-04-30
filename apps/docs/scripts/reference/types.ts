export interface IgnoreDefinition {
  category: string
  definition: string
}

export interface OverrideDefinition {
  category: string
  definition: string // original name to match
  name?: string // new display name
  order?: number // 0-based position within the category
}

export interface SpecConfig {
  language?: string
  title?: string
  subtitle?: string
  referenceLink?: string
  referenceLinkLabel?: string
  ignoreDefinitions?: IgnoreDefinition[]
  overrideDefinitions?: OverrideDefinition[]
  categoryOrder?: string[]
  [key: string]: unknown // allow extra fields (name, icon, versions, etc.)
}

export interface SpecCategory {
  category: string
  definitions: any[]
}

export interface LanguageProcessor {
  processSpec(specDir: string): { categories: SpecCategory[]; config: SpecConfig }
}

export interface MergeStrategyInput {
  path: string
  files: Array<{ content: string; templateId: string }>
}

export interface MergeStrategyResult {
  content: string
  warnings: string[]
}

export type MergeStrategy = (input: MergeStrategyInput) => MergeStrategyResult

export type ComposerResourceKind = 'config' | 'schema' | 'table' | 'bucket' | 'edge-function'

export interface ComposerResource {
  id: string
  kind: ComposerResourceKind
  label: string
  sourceFilePath: string
  sourceTemplateIds: string[]
  schema?: string
  /**
   * Set by the extractor — declares which resource this one nests under in the
   * diagram. Top-level resources omit this field. `ComposerFlow` walks the graph
   * by this field instead of hardcoding kind → parent rules.
   */
  parentResourceId?: string
  /**
   * Set by the extractor — when this resource is rendered as a top-level node,
   * should the diagram draw an edge from the central Database node to it?
   */
  connectsToDatabase?: boolean
  /**
   * Lower numbers render first when sorting top-level nodes. Resources without
   * an order fall back to alphabetical sort by label.
   */
  displayOrder?: number
  /**
   * String key the app maps to a Lucide icon. Keeps icon imports out of the
   * shared package while still letting extractors choose semantics (e.g. the
   * `auth` config section gets a key icon).
   */
  iconKey?: string
}

export interface ResourceCandidate extends Omit<ComposerResource, 'sourceTemplateIds'> {
  sourceTemplateId: string
}

export interface ResourceExtractorInput {
  path: string
  content: string
  templateId: string
}

export type ResourceExtractor = (input: ResourceExtractorInput) => ResourceCandidate[]

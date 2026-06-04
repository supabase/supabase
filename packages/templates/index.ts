// Generated bundle — embedded source data
export { categories, templates, templateIndex } from './src/generated'

// Schema
export {
  createTemplateIndex,
  parseTemplate,
  parseTemplateRegistry,
  parseTemplateSummary,
  toTemplateSummary,
} from './src/schema'
export type {
  Template,
  TemplateAuthor,
  TemplateDependencies,
  TemplateFile,
  TemplateIndex,
  TemplateRegistry,
  TemplateSummary,
} from './src/schema'

// Sources — primary public abstraction
export { createEmbeddedSource } from './src/sources/embedded'
export { createHttpSource, type HttpSourceOptions } from './src/sources/http'
export {
  parseTemplateListResponse,
  parseTemplateResponse,
  type TemplateListResponse,
  type TemplateResponse,
} from './src/sources/http-schema'
export type { TemplateSource } from './src/sources/types'

// Operations — consumer-agnostic primitives
export {
  canRemoveTemplate,
  getDefaultEnabledTemplateIds,
  getTemplatesRequiringDependency,
  resolveTemplateDependencies,
  type DependencyResolution,
} from './src/operations/dependencies'
export { filterTemplates, queryTemplates, type SearchQuery } from './src/operations/search'

// Node-only operations (filesystem, etc.) live in 'templates/node'. They are
// NOT re-exported here so this barrel stays safe for browser bundles. CLI
// consumers: `import { installTemplate } from 'templates/node'`.

// Compose — combine many templates
export { generateCompositionId, createCompositionManifest } from './src/compose/composition-id'
export { mergeTemplates } from './src/compose/merge'
export { extractComposerResources } from './src/compose/resources'
export { buildFilePathTree, type FileTreeNode } from './src/compose/file-tree'
export type { CompositionManifest, MergedFile, MergeResult } from './src/compose/types'

// Categories
export {
  groupTemplatesByCategory,
  parseCategoriesManifest,
  sortCategories,
  sortTemplates,
  type CategoriesManifest,
} from './src/categories'

// Render helpers
export { inferLanguage, resolveFileHandler } from './src/render/language'

// File-type strategy layer (per-file merge & extract — extension point)
export {
  extractFromFile,
  fileTypeRegistry,
  mergeFileEntries,
  type FileTypeHandler,
} from './src/composer/file-registry'
export { extractConfig } from './src/composer/extract-config'
export {
  EDGE_FUNCTION_PATH,
  extractEdgeFunction,
  getEdgeFunctionName,
} from './src/composer/extract-edge-function'
export { extractSql } from './src/composer/extract-sql'
export { mergeSql } from './src/composer/merge-sql'
export { mergeToml } from './src/composer/merge-toml'
export {
  matchIdentifier,
  matchQualifiedIdentifier,
  splitSqlStatements,
  splitSqlValueList,
  type QualifiedIdentifier,
} from './src/composer/sql'
export type {
  ComposerResource,
  ComposerResourceKind,
  MergeStrategy,
  MergeStrategyInput,
  MergeStrategyResult,
  ResourceCandidate,
  ResourceExtractor,
  ResourceExtractorInput,
} from './src/composer/types'

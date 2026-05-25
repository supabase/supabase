export { projectComposerTemplateIndex, projectComposerTemplates } from './src/generated'
export type {
  ProjectComposerTemplate,
  ProjectComposerTemplateDependencies,
  ProjectComposerTemplateFile,
  ProjectComposerTemplateIndex,
  ProjectComposerTemplateMetadata,
  ProjectComposerTemplateRegistry,
} from './src/schema'

export {
  extractFromFile,
  fileTypeRegistry,
  inferLanguage,
  mergeFileEntries,
  resolveFileHandler,
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
  MergeResult,
  MergeStrategy,
  MergeStrategyInput,
  MergeStrategyResult,
  MergedFile,
  ResourceCandidate,
  ResourceExtractor,
  ResourceExtractorInput,
} from './src/composer/types'

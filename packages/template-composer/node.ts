// Node-only entry point. Importing this module pulls in `node:fs`/`node:path`
// and is not safe for browser bundles. Use this from CLI tools and build
// scripts; use the default `'template-composer'` barrel everywhere else.

export {
  installTemplate,
  type InstallResult,
  type InstallTemplateOptions,
} from './src/operations/install'
export {
  createTemplateFileRefs,
  normalizeRegistrySlug,
  parseRegistryDependencyRef,
  parseRegistryItem,
  parseRegistryManifest,
  REGISTRY_GITHUB_SLUG,
  REGISTRY_HOMEPAGE,
  REGISTRY_ITEM_SCHEMA,
  REGISTRY_NAME,
  REGISTRY_SCHEMA,
  templateSummaryToRegistryItem,
  toRegistryDependencyRef,
} from './src/registry/schema'
export type { RegistryFileRef, RegistryItem, RegistryManifest } from './src/registry/schema'
export { bundleRegistryItem, resolveRegistryManifest } from './src/registry/resolve'

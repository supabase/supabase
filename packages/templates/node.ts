// Node-only entry point. Importing this module pulls in `node:fs`/`node:path`
// and is not safe for browser bundles. Use this from CLI tools and build
// scripts; use the default `'templates'` barrel everywhere else.

export { bundleTemplateRepository, type BundledRepository } from './src/bundle'
export {
  installTemplate,
  type InstallResult,
  type InstallTemplateOptions,
} from './src/operations/install'

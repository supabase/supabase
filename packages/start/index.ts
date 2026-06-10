// The get-started composer, derived from the embedded `templates` registry.
// `apps/docs` mounts this at the /start route; everything else lives here so
// the page stays self-contained and shares data with the www composer.
export { default as StartClient } from './src/StartClient'
export { getStartFeatures, type StartFeature } from './src/lib/features'

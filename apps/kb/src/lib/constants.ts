// Matches astro.config.mjs's `base` — the single source of truth for this
// value. Astro pages get it via `import.meta.env.BASE_URL`; anything running
// outside Astro's own pipeline (prebuild scripts) imports it from here.
export const BASE_PATH = '/kb'

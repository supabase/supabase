# Supabase UI Package

## Theme tokens

The checked-in source of truth for shared design tokens now lives in `styles/tokens.css`.

That file contains:
- the base token variables shared across apps and packages
- the supported theme selectors: `light`, `dark`, `deep-dark`, and `classic-dark`
- the existing semantic token contract such as `--foreground-default`, `--background-surface-100`, and `--border-default`
- typography variables such as `--font-sans`, `--font-size-base`, and the shared heading/text shorthand values

The shared Tailwind token registry lives in `styles/color-registry.js`. `packages/config/tailwind.config.js` consumes that registry so existing utility names continue to work without importing generated Figma artifacts.

## Consuming the tokens

For app stylesheets, import the canonical stylesheet directly:

```bash
@import './../../../packages/ui/styles/tokens.css';
```

For package consumers that resolve through the workspace package name, use:

```ts
import 'ui/styles/tokens.css'
```

Legacy `packages/ui/build/css/*` theme files remain as temporary wrappers around the canonical stylesheet so old import paths keep working during the migration.

## Legacy generation scripts

The old token extraction and transform scripts are still present for now, but they are no longer the runtime source of truth for shared colour tokens.

### Historical notes

The previous setup transformed Figma token exports into generated CSS and Tailwind artifacts. Those files are retained only as compatibility layers while the repo finishes moving to the checked-in CSS source.

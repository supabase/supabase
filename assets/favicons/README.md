# Favicons

The vector sources are exported from [Favicons](https://www.figma.com/design/WCja3lpEj1DeunV1d5zu5D/Design-System?node-id=4691-1489). Each master is a native 512×512 Figma component with a 96px background radius and 60% corner smoothing, equivalent to 3px at 16px. The 16, 32 and 48px previews are scaled instances of these components. Scale the vectors, never a small raster export. Preserve the variant-specific bolt gradients, shadows and proportions.

| Source           | Original node | Master node | Consumers                                                         |
| ---------------- | ------------- | ----------- | ----------------------------------------------------------------- |
| `production.svg` | `4691:1519`   | `4696:14`   | Studio production and self-hosted, WWW, UI Library, Design System |
| `docs.svg`       | `4691:1517`   | `4696:15`   | Docs, Learn, Knowledge Base                                       |
| `staging.svg`    | `4691:1512`   | `4696:17`   | Hosted Studio non-production                                      |

[Favicons (old)](https://www.figma.com/design/WCja3lpEj1DeunV1d5zu5D/Design-System?node-id=4431-5215) contains historical explorations, not interchangeable production assets.

## Generation

The SVG backgrounds are flattened Figma vectors so 60% corner smoothing survives export.

From the repository root, after `pnpm install`:

```sh
node scripts/generate-favicons.mjs
```

The script uses the existing KB Sharp dependency. Export revised Figma masters with the background flattened to a vector and `contentsOnly: true` to exclude the canvas background, replacing the corresponding source here before regenerating. Figma Plugin API example:

```js
const node = await figma.getNodeByIdAsync('4696:14')
// Use a temporary copy so the editable master keeps its native radius and smoothing.
const copy = node.clone()
const background = figma.createRectangle()
copy.insertChild(0, background)
background.resize(512, 512)
background.x = 0
background.y = 0
background.fills = node.fills
background.cornerRadius = node.cornerRadius
background.cornerSmoothing = node.cornerSmoothing
const vector = figma.flatten([background], copy, 0)
vector.x = 0
vector.y = 0
copy.fills = []
copy.cornerRadius = 0
copy.cornerSmoothing = 0
const svg = await copy.exportAsync({ format: 'SVG_STRING', contentsOnly: true })
copy.remove()
```

- `favicon.ico`: 16, 32 and 48px PNG entries rendered independently from vectors, with transparent corners.
- `apple-icon-180x180.png`: opaque 180px square, flattened against the variant's background colour. The OS supplies its own corner mask. Figma has linked square 180px export examples, with no separate artwork to maintain.
- `android-icon-192x192.png` and `android-icon-512x512.png`: rounded artwork with transparent corners, manifest purpose `any`, not `maskable`.
- `manifest.json`: relative icon URLs resolve beside the manifest under any application base path. Existing non-icon settings are retained.

Learn, UI Library and Design System use explicit layout declarations. Their `app/favicon.ico` copies are removed to avoid duplicate declarations. Shared declarations in `packages/common/MetaFavicons/icons.ts` serve Next.js pages/app routers, Studio TanStack and KB Astro. Applications select routes and detect their environments. Existing Studio environment routing is retained.

## Other artwork

WWW's historical Launch Week X favicon directory contains separate campaign artwork and remains unchanged. Its isolated legacy component has no current imports. Lite Studio keeps its independent production root ICO.

## Validation

```sh
node scripts/validate-favicons.mjs
```

The script checks dimensions, opacity, ICO entries and manifest icon URLs under different base paths. Check for duplicate icon declarations in the rendered page head separately. Inspect 16px and 32px renders against light and dark browser chrome as well as larger masters.

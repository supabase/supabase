# Favicons

The vector sources are exported from [Favicons](https://www.figma.com/design/WCja3lpEj1DeunV1d5zu5D/Design-System?node-id=4691-1489). Each master is a native 512×512 Figma component with a 96px background radius and 60% corner smoothing, equivalent to 3px at 16px. The 16, 32 and 48px previews are scaled instances of these components. Scale the vectors, never a small raster export. Preserve the variant-specific bolt gradients, shadows, proportions and local inset edge detail.

| Source           | Original node | Master node | Consumers                                                         |
| ---------------- | ------------- | ----------- | ----------------------------------------------------------------- |
| `production.svg` | `4691:1519`   | `4696:14`   | Studio production and self-hosted, WWW, UI Library, Design System |
| `docs.svg`       | `4691:1517`   | `4696:15`   | Docs, Learn, Knowledge Base                                       |
| `staging.svg`    | `4691:1512`   | `4696:17`   | Hosted Studio non-production                                      |
| `local.svg`      | `4691:1509`   | `4696:19`   | Local development in all apps, plus Studio CLI                    |

The local artwork also corresponds to the manually revised [512px reference](https://www.figma.com/design/WCja3lpEj1DeunV1d5zu5D/Design-System?node-id=4691-1483). [Favicons (old)](https://www.figma.com/design/WCja3lpEj1DeunV1d5zu5D/Design-System?node-id=4431-5215) contains historical explorations, not interchangeable production assets.

## Generation

The SVG backgrounds are flattened Figma vectors so 60% corner smoothing survives export. Local corner grid marks are filled vectors, avoiding differences in dashed-stroke rendering.

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

Learn, UI Library and Design System use explicit layout declarations. Their `app/favicon.ico` copies are removed so Next.js does not also advertise production artwork during local development. Shared declarations in `packages/common/MetaFavicons/icons.ts` serve Next.js pages/app routers, Studio TanStack and KB Astro. Applications select routes and detect their environments. Next Studio retains its runtime CLI discovery; TanStack uses the synchronous CLI/environment configuration for its initial head.

## Other artwork

WWW's historical Launch Week X favicon directory contains separate campaign artwork and remains unchanged. Its isolated legacy component has no current imports. Lite Studio keeps its independent production root ICO and explicitly selects the blue set during local development.

## Validation

```sh
node scripts/validate-favicons.mjs
```

The script checks dimensions, opacity, ICO entries and manifest icon URLs under different base paths. Check for duplicate icon declarations in the rendered page head separately. Inspect 16px and 32px renders against light and dark browser chrome as well as larger masters.

## Local development

Next.js apps select `/favicon/local` when `NODE_ENV` is `development`; Astro and React Router use `import.meta.env.DEV`. Studio also recognises its explicit local environment and CLI mode. Production builds retain each app's normal branding. Manifest URLs follow the selected route and application base path.

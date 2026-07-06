import { createRequire } from 'node:module'

import { resolveSharedDataPath } from '../../components/SharedData.utils'

// tsx's ESM loader can't pick up named exports from the `shared-data` package
// (CJS, no `"type": "module"`). Load via `createRequire` to use CJS interop —
// this file only runs in the build script, never in the Next.js bundle.
const { config, logConstants } = createRequire(import.meta.url)('shared-data')

type Field = { path: string; type: string }
type Schema = { name: string; fields: Field[] }

const sharedData: Record<string, unknown> = { config, logConstants }

const renderLogConstants = (data: { schemas: Schema[] }): string =>
  data.schemas
    .map(
      (s) =>
        `#### ${s.name}\n${[...s.fields]
          .sort((a, b) => a.path.localeCompare(b.path))
          .map((f) => ` - \`${f.path}\`, \`${f.type}\``)
          .join('\n')}`
    )
    .join('\n\n')

export const SharedData = ({
  props,
  children,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  const dataset = sharedData[String(props.data ?? '')]
  if (!dataset) return children

  // String-path pattern: `<SharedData data="config">a.b.c</SharedData>`.
  const value = resolveSharedDataPath(dataset, children.trim())
  if (value != null) return String(value)

  // Render-function pattern: `<SharedData data="logConstants">{(d) => …}`.
  // The schema walker strips the MDX expression children before this handler
  // runs, and we can't evaluate the function statically anyway — hardcode the
  // markdown for the only dataset that uses this form today.
  if (props.data === 'logConstants') return renderLogConstants(dataset as { schemas: Schema[] })
  return ''
}

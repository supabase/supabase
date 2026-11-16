/**
 * The ConfigFormats transform renders `supabase/config.toml` examples in both
 * TOML and JSONC. A TOML fence opts in with `name=supabase/config.toml`:
 *
 * - inside `<$CodeTabs>`, a `supabase/config.jsonc` fence is added as a tab
 * - anywhere else, the fence becomes a `ConfigCodeTabs` with both formats
 */

import { convertCliConfigTomlToJsonc } from '@supabase/config/internal'
import { Effect } from 'effect'
import { type Code, type Parent, type Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visitParents } from 'unist-util-visit-parents'

export const CONFIG_TOML_NAME = 'supabase/config.toml'
export const CONFIG_JSONC_NAME = 'supabase/config.jsonc'

const SCHEMA_MEMBER = /^\{\n {2}"\$schema": "[^"]*",\n\n?/

export async function convertConfigTomlToJsonc(source: string): Promise<string> {
  const result = await Effect.runPromise(Effect.result(convertCliConfigTomlToJsonc(source)))

  if (result._tag === 'Failure') {
    const { reason, detail, sourceLine } = result.failure
    const firstLine = source.split('\n').find((line) => line.trim() !== '') ?? ''
    throw new Error(
      `Could not convert config.toml snippet to JSONC (${reason}: ${detail}` +
        `${sourceLine === undefined ? '' : `, line ${sourceLine}`}). ` +
        `Snippet starts with: ${firstLine}`
    )
  }

  const { text, schemaSource } = result.success
  return (schemaSource === 'default' ? text.replace(SCHEMA_MEMBER, '{\n') : text).trimEnd()
}

export function configFormatsRemark() {
  return async function transform(tree: Root) {
    const targets: Array<{ node: Code; parent: Parent }> = []
    visitParents(tree, 'code', (node: Code, ancestors: Array<Parent>) => {
      if (isConfigToml(node)) {
        targets.push({ node, parent: ancestors[ancestors.length - 1] })
      }
    })

    for (const { node, parent } of targets) {
      const jsonc = await convertConfigTomlToJsonc(node.value)
      const index = parent.children.indexOf(node)

      if (isCodeTabs(parent)) {
        parent.children.splice(index + 1, 0, {
          type: 'code',
          lang: 'jsonc',
          meta: `name=${CONFIG_JSONC_NAME}`,
          value: jsonc,
        })
      } else {
        const meta = stripName(node.meta)
        parent.children.splice(
          index,
          1,
          configCodeTabs([
            tabPanel(CONFIG_TOML_NAME, { ...node, meta }),
            tabPanel(CONFIG_JSONC_NAME, { type: 'code', lang: 'jsonc', meta, value: jsonc }),
          ])
        )
      }
    }

    return tree
  }
}

function isConfigToml(node: Code) {
  return (
    node.lang === 'toml' &&
    node.meta?.split(/\s+/).some((token) => token === `name=${CONFIG_TOML_NAME}`) === true
  )
}

function isCodeTabs(node: Parent) {
  return node.type === 'mdxJsxFlowElement' && (node as MdxJsxFlowElement).name === '$CodeTabs'
}

function stripName(meta: string | null | undefined) {
  const rest = meta
    ?.split(/\s+/)
    .filter((token) => token && !token.startsWith('name='))
    .join(' ')
  return rest || null
}

function tabPanel(name: string, code: Code): MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement',
    name: 'TabPanel',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'id', value: name },
      { type: 'mdxJsxAttribute', name: 'label', value: name },
    ],
    children: [code],
  }
}

function configCodeTabs(children: Array<MdxJsxFlowElement>): MdxJsxFlowElement {
  return { type: 'mdxJsxFlowElement', name: 'ConfigCodeTabs', attributes: [], children }
}

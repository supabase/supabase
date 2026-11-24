/**
 * The ConfigFormats transform renders `supabase/config.toml` examples in both
 * TOML and JSONC. A TOML fence opts in by naming the file, either as
 * ```` ```toml supabase/config.toml ```` or ```` ```toml name=supabase/config.toml ````:
 *
 * - inside `<$CodeTabs>`, a `supabase/config.jsonc` fence is added as a tab
 * - anywhere else, the fence becomes a `CodeTabs` with both formats, synced
 *   across the page through the `config-format` query group
 */

import { CliConfigConvertError, convertCliConfigTomlToJsonc } from '@supabase/config/convert'
import { type Code, type Parent, type Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visitParents } from 'unist-util-visit-parents'

export const CONFIG_TOML_NAME = 'supabase/config.toml'
export const CONFIG_JSONC_NAME = 'supabase/config.jsonc'
export const CONFIG_FORMAT_QUERY_GROUP = 'config-format'

const SCHEMA_MEMBER = /^\{\n {2}"\$schema": "[^"]*",\n\n?/

export function convertConfigTomlToJsonc(source: string): string {
  try {
    const { text, schemaSource } = convertCliConfigTomlToJsonc(source)
    return (schemaSource === 'default' ? text.replace(SCHEMA_MEMBER, '{\n') : text).trimEnd()
  } catch (error) {
    if (!(error instanceof CliConfigConvertError)) throw error
    const { reason, detail, sourceLine } = error
    const firstLine = source.split('\n').find((line) => line.trim() !== '') ?? ''
    throw new Error(
      `Could not convert config.toml snippet to JSONC (${reason}: ${detail}` +
        `${sourceLine === undefined ? '' : `, line ${sourceLine}`}). ` +
        `Snippet starts with: ${firstLine}`
    )
  }
}

export function configFormatsRemark() {
  return function transform(tree: Root) {
    const targets: Array<{ node: Code; parent: Parent }> = []
    visitParents(tree, 'code', (node: Code, ancestors: Array<Parent>) => {
      if (isConfigToml(node)) {
        targets.push({ node, parent: ancestors[ancestors.length - 1] })
      }
    })

    for (const { node, parent } of targets) {
      const jsonc = convertConfigTomlToJsonc(node.value)
      const index = parent.children.indexOf(node)

      if (isCodeTabs(parent)) {
        node.meta = [`name=${CONFIG_TOML_NAME}`, stripName(node.meta)].filter(Boolean).join(' ')
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
            tabPanel('toml', CONFIG_TOML_NAME, { ...node, meta }),
            tabPanel('jsonc', CONFIG_JSONC_NAME, {
              type: 'code',
              lang: 'jsonc',
              meta,
              value: jsonc,
            }),
          ])
        )
      }
    }

    return tree
  }
}

function isConfigToml(node: Code) {
  return node.lang === 'toml' && node.meta?.split(/\s+/).some(isConfigTomlName) === true
}

function isConfigTomlName(token: string) {
  return token === CONFIG_TOML_NAME || token === `name=${CONFIG_TOML_NAME}`
}

function isCodeTabs(node: Parent) {
  return node.type === 'mdxJsxFlowElement' && (node as MdxJsxFlowElement).name === '$CodeTabs'
}

function stripName(meta: string | null | undefined) {
  const rest = meta
    ?.split(/\s+/)
    .filter((token) => token && !token.startsWith('name=') && !isConfigTomlName(token))
    .join(' ')
  return rest || null
}

function tabPanel(id: string, label: string, code: Code): MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement',
    name: 'TabPanel',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'id', value: id },
      { type: 'mdxJsxAttribute', name: 'label', value: label },
    ],
    children: [code],
  }
}

function configCodeTabs(children: Array<MdxJsxFlowElement>): MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement',
    name: 'CodeTabs',
    attributes: [{ type: 'mdxJsxAttribute', name: 'queryGroup', value: CONFIG_FORMAT_QUERY_GROUP }],
    children,
  }
}

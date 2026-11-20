import {
  CONFIG_JSONC_NAME,
  CONFIG_TOML_NAME,
  convertConfigTomlToJsonc,
} from '~/features/directives/ConfigFormats'
import type { Parameter } from '~/lib/refGenerator/refTypes'

export const CONFIG_REFERENCE_SLUG = 'local-development/cli/config'
export const CONFIG_REFERENCE_SPEC = 'spec/cli_v1_config.yaml'

export interface ConfigSpec {
  info: { description: string; tags: Array<{ id: string; title: string }> }
  parameters: Array<Parameter>
}

/** Renders the config reference page, which is built from the spec rather than MDX. */
export function renderConfigReferenceMarkdown(spec: ConfigSpec): string {
  const parts = ['# Supabase CLI config', spec.info.description.trim()]

  for (const tag of spec.info.tags) {
    parts.push(`## ${tag.title} Config`)
    for (const parameter of spec.parameters.filter((p) => p.tags?.[0] === tag.id)) {
      parts.push(renderParameter(parameter))
    }
  }

  return parts.join('\n\n') + '\n'
}

function renderParameter(parameter: Parameter): string {
  const block = [
    `### \`${parameter.title}\``,
    [
      '| Name | Default | Required |',
      '| --- | --- | --- |',
      `| \`${parameter.id}\` | ${tableCell(parameter.default?.toString() ?? 'None')} | ${parameter.required ?? ''} |`,
    ].join('\n'),
    parameter.description.trim(),
  ]

  if (parameter.usage) {
    const toml = parameter.usage.trim()
    const jsonc = convertConfigTomlToJsonc(parameter.usage)
    block.push(`**${CONFIG_TOML_NAME}**`, '```toml\n' + toml + '\n```')
    block.push(`**${CONFIG_JSONC_NAME}**`, '```jsonc\n' + jsonc + '\n```')
  }

  if (parameter.links?.length) {
    block.push(
      'See also:',
      parameter.links.map((link) => `- [${link.name}](${link.link})`).join('\n')
    )
  }

  return block.join('\n\n')
}

function tableCell(value: string) {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

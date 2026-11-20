import { readFileSync } from 'node:fs'
import path from 'node:path'

const SCHEMA_PATH = path.join(process.cwd(), 'features/docs/generated/terraform.schema.json')

function attributesTable(attributes: Record<string, any>, extraColumns: string[]): string {
  const columns = ['Description', ...extraColumns]
  const header = `| Attribute | ${columns.join(' | ')} |`
  const divider = `| --- | ${columns.map(() => '---').join(' | ')} |`
  const rows = Object.entries(attributes).map(
    ([name, attribute]) =>
      `| \`${name}\` | ${columns.map((column) => String(attribute[column.toLowerCase()] ?? '')).join(' | ')} |`
  )
  return [header, divider, ...rows].join('\n')
}

export const TerraformProviderSchema = (): string => {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'))
  const provider = schema.provider_schemas['registry.terraform.io/supabase/supabase']

  const resources = Object.entries(provider.resource_schemas)
    .map(
      ([name, resource]: [string, any]) =>
        `### ${name}\n\n${attributesTable(resource.block.attributes, ['Type', 'Required', 'Optional'])}`
    )
    .join('\n\n')

  const dataSources = Object.entries(provider.data_source_schemas)
    .map(
      ([name, dataSource]: [string, any]) =>
        `### ${name}\n\n${attributesTable(dataSource.block.attributes, ['Type', 'Required', 'Optional'])}`
    )
    .join('\n\n')

  return [
    `## Provider settings\n\n${attributesTable(provider.provider.block.attributes, ['Type', 'Optional', 'Sensitive'])}`,
    `## Resources\n\n${resources}`,
    `## Data sources\n\n${dataSources}`,
  ].join('\n\n')
}

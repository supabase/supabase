import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { TabPanel, Tabs } from '~/features/ui/Tabs'
import { GENERATED_DIRECTORY } from '~/lib/docs'
import { codeBlock } from 'common-tags'
import { Check, PlusCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Heading, Popover, PopoverContent, PopoverTrigger } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

function ProviderSettings({ schema }: { schema: any }) {
  const attributes = schema.block.attributes

  const example = codeBlock`
    provider "supabase" {
        ${Object.keys(attributes).map(
          (attribute) =>
            `${attribute} = ${attributes[attribute].type === 'string' ? `""` : '<value>'}`
        )}
    }
  `

  return (
    <section aria-labelledby="provider-settings" className="prose max-w-none">
      <Heading tag="h2">Provider settings</Heading>
      <p>
        Use these settings to configure your Supabase provider and authenticate to your Supabase
        project.
      </p>
      <Heading tag="h3">Example usage</Heading>
      <CodeBlock className="not-prose">{example}</CodeBlock>
      <Heading tag="h3">Details</Heading>
      {/* extra div because width restriction doesn't work on table itself */}
      <div className="w-full overflow-auto">
        <table>
          <thead>
            <tr>
              <th>Attribute</th>
              <th>Description</th>
              <th>Type</th>
              <th>Optional</th>
              <th>Sensitive</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(schema.block.attributes).map((attribute) => (
              <tr key={attribute}>
                <td>{attribute}</td>
                <td>
                  <ReactMarkdown>{attributes[attribute].description}</ReactMarkdown>
                </td>
                <td>{attributes[attribute].type}</td>
                <td className="align-middle">
                  {attributes[attribute].optional && (
                    <>
                      <Check className="ml-[2.5ch]" />
                      <span className="sr-only">true</span>
                    </>
                  )}
                </td>
                <td className="align-middle">
                  {attributes[attribute].sensitive && (
                    <>
                      <Check className="ml-[2.5ch]" />
                      <span className="sr-only">true</span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Resources({ schema }: { schema: any }) {
  return (
    <section aria-labelledby="resources" className="prose max-w-none">
      <Heading tag="h2">Resources</Heading>
      <p>You can configure these resources using the Supabase Terraform provider:</p>
      <Tabs>
        {Object.keys(schema).map((resource) => (
          <TabPanel id={resource} label={resource}>
            <Heading tag="h4">Example usage</Heading>
            <CodeBlock className="not-prose">{codeBlock`
                resource "${resource}" "<label>" {
                    ${Object.keys(schema[resource].block.attributes)
                      .filter((attribute) => !schema[resource].block.attributes[attribute].computed)
                      .map(
                        (attribute) =>
                          `${attribute} = ${
                            schema[resource].block.attributes[attribute].type === 'string'
                              ? `""`
                              : '<value>'
                          }`
                      )}
                }
            `}</CodeBlock>
            <Heading tag="h4">Details</Heading>
            <table>
              <thead>
                <tr>
                  <th>Attribute</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Optional</th>
                  <th>Read-only</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(schema[resource].block.attributes).map((attribute) => (
                  <tr key={attribute}>
                    <td>
                      <code>{attribute}</code>
                    </td>
                    <td>
                      <ReactMarkdown>
                        {schema[resource].block.attributes[attribute].description}
                      </ReactMarkdown>
                    </td>
                    <td>
                      {schema[resource].block.attributes[attribute].type ?? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center justify-between gap-2">
                              Nested type
                              <PlusCircle size={14} className="shrink-0" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="max-h-[50vh] overflow-auto">
                            <ul>
                              {Object.keys(
                                schema[resource].block.attributes[attribute].nested_type.attributes
                              ).map((nestedAttribute) => (
                                <li key={nestedAttribute}>
                                  {nestedAttribute}
                                  <ul>
                                    <li className="*:m-0!">
                                      <ReactMarkdown>
                                        {
                                          schema[resource].block.attributes[attribute].nested_type
                                            .attributes[nestedAttribute].description
                                        }
                                      </ReactMarkdown>
                                    </li>
                                    <li>
                                      {schema[resource].block.attributes[attribute].nested_type
                                        .attributes[nestedAttribute].type ?? 'nested type'}
                                    </li>
                                    {schema[resource].block.attributes[attribute].nested_type
                                      .attributes[nestedAttribute].required && <li>Required</li>}
                                    {schema[resource].block.attributes[attribute].nested_type
                                      .attributes[nestedAttribute].optional && <li>Optional</li>}
                                    {schema[resource].block.attributes[attribute].nested_type
                                      .attributes[nestedAttribute].computed && <li>Read-only</li>}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </PopoverContent>
                        </Popover>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[resource].block.attributes[attribute].required && (
                        <>
                          <Check className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[resource].block.attributes[attribute].optional && (
                        <>
                          <Check className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[resource].block.attributes[attribute].computed && (
                        <>
                          <Check className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabPanel>
        ))}
      </Tabs>
    </section>
  )
}

function DataSources({ schema }: { schema: any }) {
  return (
    <section aria-labelledby="data-sources" className="prose max-w-none">
      <Heading tag="h2">Data sources</Heading>
      <p>You can read these resources using the Supabase Terraform provider:</p>
      <Tabs>
        {Object.keys(schema).map((dataSource) => (
          <TabPanel id={dataSource} label={dataSource}>
            <Heading tag="h4">Example usage</Heading>
            <CodeBlock className="not-prose">{codeBlock`
                  resource "${dataSource}" "all" {
                      ${Object.keys(schema[dataSource].block.attributes)
                        .filter(
                          (attribute) => !schema[dataSource].block.attributes[attribute].computed
                        )
                        .map(
                          (attribute) =>
                            `${attribute} = ${
                              schema[dataSource].block.attributes[attribute].type === 'string'
                                ? `""`
                                : '<value>'
                            }`
                        )}
                  }
              `}</CodeBlock>
            <Heading tag="h4">Details</Heading>
            <table>
              <thead>
                <tr>
                  <th>Attribute</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Optional</th>
                  <th>Read-only</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(schema[dataSource].block.attributes).map((attribute) => (
                  <tr key={attribute}>
                    <td>
                      <code>{attribute}</code>
                    </td>
                    <td>
                      <ReactMarkdown>
                        {schema[dataSource].block.attributes[attribute].description}
                      </ReactMarkdown>
                    </td>
                    <td>
                      {schema[dataSource].block.attributes[attribute].type ?? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center justify-between gap-2">
                              Nested type
                              <PlusCircle size={14} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="max-h-[50vh] overflow-auto">
                            {schema[dataSource].block.attributes[attribute].nested_type
                              .nesting_mode === 'set' && 'Array of:'}
                            <ul>
                              {Object.keys(
                                schema[dataSource].block.attributes[attribute].nested_type
                                  .attributes
                              ).map((nestedAttribute) => (
                                <li key={nestedAttribute}>
                                  {nestedAttribute}
                                  <ul>
                                    <li className="*:m-0!">
                                      <ReactMarkdown>
                                        {
                                          schema[dataSource].block.attributes[attribute].nested_type
                                            .attributes[nestedAttribute].description
                                        }
                                      </ReactMarkdown>
                                    </li>
                                    <li>
                                      {schema[dataSource].block.attributes[attribute].nested_type
                                        .attributes[nestedAttribute].type ?? 'nested type'}
                                    </li>
                                    {schema[dataSource].block.attributes[attribute].nested_type
                                      .attributes[nestedAttribute].required && <li>Required</li>}
                                    {schema[dataSource].block.attributes[attribute].nested_type
                                      .attributes[nestedAttribute].optional && <li>Optional</li>}
                                    {schema[dataSource].block.attributes[attribute].nested_type
                                      .attributes[nestedAttribute].computed && <li>Read-only</li>}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </PopoverContent>
                        </Popover>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[dataSource].block.attributes[attribute].required && (
                        <>
                          <Check className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[dataSource].block.attributes[attribute].optional && (
                        <>
                          <Check className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[dataSource].block.attributes[attribute].computed && (
                        <>
                          <Check className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabPanel>
        ))}
      </Tabs>
    </section>
  )
}

export async function TerraformProviderSchema() {
  const raw = await readFile(join(GENERATED_DIRECTORY, 'terraform.schema.json'), 'utf-8')
  const schema = JSON.parse(raw)
  const providerSchema = schema.provider_schemas['registry.terraform.io/supabase/supabase']

  return (
    <>
      <ProviderSettings schema={providerSchema.provider} />
      <Resources schema={providerSchema.resource_schemas} />
      <DataSources schema={providerSchema.data_source_schemas} />
    </>
  )
}

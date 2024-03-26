import { codeBlock } from 'common-tags'
import { GetStaticProps, InferGetStaticPropsType } from 'next'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

import {
  CodeBlock,
  Heading,
  IconCheck,
  IconPlusCircle,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Tabs,
} from 'ui'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/DefaultGuideLayout'
import { org, repo, branch, docsDir } from './[[...slug]]'

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
                      <IconCheck className="ml-[2.5ch]" />
                      <span className="sr-only">true</span>
                    </>
                  )}
                </td>
                <td className="align-middle">
                  {attributes[attribute].sensitive && (
                    <>
                      <IconCheck className="ml-[2.5ch]" />
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
          <Tabs.Panel id={resource} label={resource}>
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
                        <Popover_Shadcn_>
                          <PopoverTrigger_Shadcn_ asChild>
                            <button className="flex items-center justify-between gap-2">
                              Nested type
                              <IconPlusCircle size={14} className="shrink-0" />
                            </button>
                          </PopoverTrigger_Shadcn_>
                          <PopoverContent_Shadcn_ className="max-h-[50vh] overflow-auto">
                            <ul>
                              {Object.keys(
                                schema[resource].block.attributes[attribute].nested_type.attributes
                              ).map((nestedAttribute) => (
                                <li key={nestedAttribute}>
                                  {nestedAttribute}
                                  <ul>
                                    <li>
                                      <ReactMarkdown className="*:!m-0">
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
                          </PopoverContent_Shadcn_>
                        </Popover_Shadcn_>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[resource].block.attributes[attribute].required && (
                        <>
                          <IconCheck className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[resource].block.attributes[attribute].optional && (
                        <>
                          <IconCheck className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[resource].block.attributes[attribute].computed && (
                        <>
                          <IconCheck className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabs.Panel>
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
          <Tabs.Panel id={dataSource} label={dataSource}>
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
                        <Popover_Shadcn_>
                          <PopoverTrigger_Shadcn_ asChild>
                            <button className="flex items-center justify-between gap-2">
                              Nested type
                              <IconPlusCircle size={14} />
                            </button>
                          </PopoverTrigger_Shadcn_>
                          <PopoverContent_Shadcn_ className="max-h-[50vh] overflow-auto">
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
                                    <li>
                                      <ReactMarkdown className="*:!m-0">
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
                          </PopoverContent_Shadcn_>
                        </Popover_Shadcn_>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[dataSource].block.attributes[attribute].required && (
                        <>
                          <IconCheck className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[dataSource].block.attributes[attribute].optional && (
                        <>
                          <IconCheck className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                    <td className="align-middle">
                      {schema[dataSource].block.attributes[attribute].computed && (
                        <>
                          <IconCheck className="ml-[2.5ch]" />
                          <span className="sr-only">true</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabs.Panel>
        ))}
      </Tabs>
    </section>
  )
}

export default function PGGraphQLDocs({
  meta,
  schema,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout menuId={MenuId.Platform} meta={meta}>
      The Terraform Provider provices access to{' '}
      <Link
        href="https://developer.hashicorp.com/terraform/language/resources"
        rel="noopener noreferrer"
      >
        resources
      </Link>{' '}
      and{' '}
      <Link
        href="https://developer.hashicorp.com/terraform/language/data-sources"
        rel="noreferrer noopener"
      >
        data sources
      </Link>
      . Resources are infrastructure objects, such as a Supabase project, that you can declaratively
      configure. Data sources are sources of information about your Supabase instances.
      <ProviderSettings
        schema={schema.provider_schemas['registry.terraform.io/supabase/supabase'].provider}
      />
      <Resources
        schema={schema.provider_schemas['registry.terraform.io/supabase/supabase'].resource_schemas}
      />
      <DataSources
        schema={
          schema.provider_schemas['registry.terraform.io/supabase/supabase'].data_source_schemas
        }
      />
    </Layout>
  )
}

/**
 * Fetch JSON schema from external repo
 */
export const getStaticProps = (async () => {
  const meta = {
    title: 'Terraform Provider reference',
    subtitle: 'Resources and data sources available through the Terraform Provider',
  }

  let response = await fetch(
    `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${docsDir}/schema.json`
  )
  if (!response.ok) throw Error('Failed to fetch Terraform JSON schema from GitHub')

  const schema = await response.json()

  return {
    props: {
      meta,
      schema,
    },
  }
}) satisfies GetStaticProps

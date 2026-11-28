import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Heading,
} from 'ui'

import { ReferenceBetaMarkdown } from './ReferenceBeta.markdown'
import { ReferenceBetaPageTemplate } from './ReferenceBeta.pageTemplate'
import type { Parameter } from './ReferenceBeta.schema'
import {
  definitionLabels,
  parameterLabels,
  referenceBetaHref,
  type Definition,
} from './ReferenceBeta.utils'

/**
 * How parameters are grouped depends on the kind of definition. Methods,
 * classes, types and constants get a single list; commands and endpoints split
 * by where the value is passed.
 */
const PARAMETER_GROUPS: Record<Definition['meta']['kind'], [location: string, label: string][]> = {
  method: [],
  class: [],
  type: [],
  constant: [],
  command: [
    ['positional', 'Arguments'],
    ['flag', 'Flags'],
  ],
  endpoint: [
    ['path', 'Path parameters'],
    ['query', 'Query parameters'],
    ['header', 'Headers'],
    ['body', 'Body'],
  ],
}

function groupParameters({ kind, parameters }: Definition['meta']) {
  if (PARAMETER_GROUPS[kind].length === 0) {
    const label = kind === 'class' ? 'Constructor parameters' : 'Parameters'
    return [{ label, parameters }].filter((group) => group.parameters.length > 0)
  }

  const known = PARAMETER_GROUPS[kind].map(([location]) => location)
  return [
    ...PARAMETER_GROUPS[kind].map(([location, label]) => ({
      label,
      parameters: parameters.filter((p) => p.location === location),
    })),
    {
      label: 'Other parameters',
      parameters: parameters.filter((p) => !p.location || !known.includes(p.location)),
    },
  ].filter((group) => group.parameters.length > 0)
}

const formatValue = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value))

type HiddenLabels = ReadonlySet<string>

function ParameterList({ parameters, hidden }: { parameters: Parameter[]; hidden: HiddenLabels }) {
  return (
    <ul>
      {parameters.map((parameter) => {
        const labels = parameterLabels(parameter, hidden).join(', ')
        return (
          <li key={parameter.name}>
            <code>
              {parameter.short ? `${parameter.short}, ` : ''}
              {parameter.name}
              {parameter.variadic ? ' …' : ''}
            </code>
            {parameter.type && <> {parameter.type}</>}
            {labels && ` — ${labels}`}
            {parameter.description && (
              <ReferenceBetaMarkdown>{parameter.description}</ReferenceBetaMarkdown>
            )}
            {parameter.default !== undefined && parameter.default !== null && (
              <p>
                Default: <code>{formatValue(parameter.default)}</code>
              </p>
            )}
            {parameter.allowed_values && parameter.allowed_values.length > 0 && (
              <p>
                One of:{' '}
                {parameter.allowed_values.map((value, i) => (
                  <span key={String(value)}>
                    {i > 0 && ', '}
                    <code>{formatValue(value)}</code>
                  </span>
                ))}
              </p>
            )}
            {parameter.env && (
              <p>
                Environment variable: <code>{parameter.env}</code>
              </p>
            )}
            {parameter.replaced_by && (
              <p>
                Use <code>{parameter.replaced_by}</code> instead.
              </p>
            )}
            {parameter.children && parameter.children.length > 0 && (
              <ParameterList parameters={parameter.children} hidden={hidden} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

const slugify = (label: string) => label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <Heading tag="h2" customAnchor={slugify(title)}>
      {title}
    </Heading>
    {children}
  </section>
)

/** A single definition: signature, parameters, returns, notes and examples. */
export function ReferenceBetaDefinitionLayout({ definition }: { definition: Definition }) {
  const { library, meta, content } = definition
  const hidden: HiddenLabels = new Set(library.meta.hidden_labels)
  const symbolLabel = meta.symbol && meta.symbol !== meta.title
  const labels = definitionLabels(meta, hidden)

  return (
    <ReferenceBetaPageTemplate
      title={meta.title}
      header={
        <header className="mb-12">
          <div className="not-prose mb-8">
            <Breadcrumb>
              <BreadcrumbList className="text-foreground-lighter p-0">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/reference-beta">Reference</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={referenceBetaHref(library.slug)}>{library.meta.title}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{meta.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <h1 className="mt-0 mb-0">{meta.title}</h1>
          <p className="mt-3 mb-0 text-xl leading-7 text-foreground-light">{meta.summary}</p>
          {symbolLabel || labels.length > 0 || meta.since ? (
            <p className="mt-3 mb-0 text-sm text-foreground-lighter">
              {symbolLabel && <code>{meta.symbol}</code>}
              {labels.map((label) => ` ${label}`)}
              {meta.since && ` since ${meta.since}`}
            </p>
          ) : null}
        </header>
      }
    >
      {meta.description && <ReferenceBetaMarkdown>{meta.description}</ReferenceBetaMarkdown>}

      {meta.http && (
        <CodeBlock lang="http" contents={`${meta.http.method} ${meta.http.path}`} hideControls />
      )}
      {meta.signature && <CodeBlock lang={library.meta.code_lang} contents={meta.signature} />}
      {meta.usage && <CodeBlock lang="sh" contents={meta.usage} />}

      {meta.requires && meta.requires.length > 0 && (
        <Section title="Requirements">
          <ul>
            {meta.requires.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </Section>
      )}

      {meta.auth && (
        <Section title="Authorization">
          <ul>
            {meta.auth.scopes.length > 0 && <li>OAuth scopes: {meta.auth.scopes.join(', ')}</li>}
            {meta.auth.permissions.length > 0 && (
              <li>Token permissions: {meta.auth.permissions.join(', ')}</li>
            )}
          </ul>
        </Section>
      )}

      {groupParameters(meta).map(({ label, parameters }) => (
        <Section key={label} title={label}>
          <ParameterList parameters={parameters} hidden={hidden} />
        </Section>
      ))}

      {meta.properties.length > 0 && (
        <Section title="Properties">
          <ParameterList parameters={meta.properties} hidden={hidden} />
        </Section>
      )}

      {meta.returns && (
        <Section title="Returns">
          <p>
            <code>{meta.returns.type}</code>
          </p>
          {meta.returns.description && (
            <ReferenceBetaMarkdown>{meta.returns.description}</ReferenceBetaMarkdown>
          )}
        </Section>
      )}

      {meta.responses && meta.responses.length > 0 && (
        <Section title="Responses">
          <ul>
            {meta.responses.map((response) => (
              <li key={response.status}>
                <code>{response.status}</code>
                {response.description && ` ${response.description}`}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {meta.throws.length > 0 && (
        <Section title="Throws">
          <ul>
            {meta.throws.map((thrown, i) => (
              <li key={thrown.type ?? i}>
                {thrown.type && <code>{thrown.type}</code>}
                {thrown.description &&
                  (thrown.type ? (
                    ` ${thrown.description}`
                  ) : (
                    <ReferenceBetaMarkdown>{thrown.description}</ReferenceBetaMarkdown>
                  ))}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {content && (
        <Section title="Notes">
          <ReferenceBetaMarkdown>{content}</ReferenceBetaMarkdown>
        </Section>
      )}

      {meta.examples.length > 0 && (
        <Section title="Examples">
          {meta.examples.map((example) => (
            <div key={example.id}>
              <Heading tag="h3" customAnchor={`example-${example.id}`}>
                {example.title}
              </Heading>
              {example.description && (
                <ReferenceBetaMarkdown>{example.description}</ReferenceBetaMarkdown>
              )}
              <CodeBlock lang={example.lang} contents={example.code} />
              {example.response && (
                <>
                  <p>Response</p>
                  <CodeBlock
                    lang={/^\s*[{[]/.test(example.response) ? 'json' : 'plaintext'}
                    contents={example.response}
                    hideControls
                  />
                </>
              )}
            </div>
          ))}
        </Section>
      )}
    </ReferenceBetaPageTemplate>
  )
}

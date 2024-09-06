import { Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  cn,
  CodeBlock,
} from 'ui'

import { REFERENCES } from '~/content/navigation.references'
import { MDXRemoteRefs, getRefMarkdown } from '~/features/docs/Reference.mdx'
import { MDXProviderReference } from '~/features/docs/Reference.mdx.client'
import type { MethodTypes } from '~/features/docs/Reference.typeSpec'
import {
  getCliSpec,
  getFlattenedSections,
  getFunctionsList,
  getTypeSpec,
} from '~/features/docs/Reference.generated.singleton'
import {
  CollapsibleDetails,
  FnParameterDetails,
  RefSubLayout,
  RequiredBadge,
  ReturnTypeDetails,
  StickyHeader,
} from '~/features/docs/Reference.ui'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { normalizeMarkdown } from '~/features/docs/Reference.utils'
import { RefInternalLink } from './Reference.navigation.client'

type RefSectionsProps = {
  libraryId: string
  version: string
}

async function RefSections({ libraryId, version }: RefSectionsProps) {
  let flattenedSections = await getFlattenedSections(libraryId, version)
  flattenedSections = trimIntro(flattenedSections)

  return (
    <MDXProviderReference>
      <div className="flex flex-col my-16 gap-16">
        {flattenedSections
          .filter((section) => section.type !== 'category')
          .map((section, idx) => (
            <Fragment key={`${section.id}-${idx}`}>
              <SectionDivider />
              <SectionSwitch libraryId={libraryId} version={version} section={section} />
            </Fragment>
          ))}
      </div>
    </MDXProviderReference>
  )
}

function trimIntro(sections: Array<AbbrevApiReferenceSection>) {
  const hasIntro = sections[0]?.type === 'markdown' && sections[0]?.slug === 'introduction'
  if (hasIntro) {
    return sections.slice(1)
  }
  return sections
}

function SectionDivider() {
  return <hr />
}

type SectionSwitchProps = {
  libraryId: string
  version: string
  section: AbbrevApiReferenceSection
}

export function SectionSwitch({ libraryId, version, section }: SectionSwitchProps) {
  const libPath = REFERENCES[libraryId].libPath
  const allAvailableVersions = REFERENCES[libraryId].versions
  const isLatestVersion = allAvailableVersions.length === 0 || version === allAvailableVersions[0]

  const sectionLink = `/docs/reference/${libPath}/${isLatestVersion ? '' : `${version}/`}${section.slug}`

  switch (section.type) {
    case 'markdown':
      return (
        <MarkdownSection
          libPath={libPath}
          version={version}
          isLatestVersion={isLatestVersion}
          link={sectionLink}
          section={section}
        />
      )
    case 'function':
      return (
        <FunctionSection
          sdkId={libraryId}
          version={version}
          link={sectionLink}
          section={section}
          useTypeSpec={REFERENCES[libraryId].typeSpec}
        />
      )
    case 'cli-command':
      return <CliCommandSection link={sectionLink} section={section} />
    default:
      console.error(`Unhandled type in reference sections: ${section.type}`)
      return null
  }
}

interface MarkdownSectionProps {
  libPath: string
  version: string
  isLatestVersion: boolean
  link: string
  section: AbbrevApiReferenceSection
}

async function MarkdownSection({
  libPath,
  version,
  isLatestVersion,
  link,
  section,
}: MarkdownSectionProps) {
  const content = await getRefMarkdown(
    section.meta?.shared
      ? `shared/${section.id}`
      : `${libPath}/${isLatestVersion ? '' : `${version}/`}${section.id}`
  )

  return (
    <RefSubLayout.EducationSection link={link} {...section}>
      <StickyHeader {...section} />
      <MDXRemoteRefs source={content} />
    </RefSubLayout.EducationSection>
  )
}

interface CliCommandSectionProps {
  link: string
  section: AbbrevApiReferenceSection
}

async function CliCommandSection({ link, section }: CliCommandSectionProps) {
  const cliSpec = await getCliSpec()
  const command = ((cliSpec as any).commands ?? []).find((cmd) => cmd.id === section.id)

  if (!command) return null

  return (
    <RefSubLayout.Section columns="double" link={link} {...section}>
      <StickyHeader title={command.title} className="col-[1_/_-1]" monoFont={true} />
      <div>
        {command.description && (
          <ReactMarkdown className="prose break-words mb-8">{command.description}</ReactMarkdown>
        )}
        {(command.subcommands ?? []).length > 0 && (
          <>
            <h3 className="mb-3 text-base text-foreground">Subcommands</h3>
            <ul className="prose">
              {command.subcommands.map((subcommand, index) => {
                const subcommandDetails = (cliSpec as any).commands.find(
                  (cmd) => cmd.id === subcommand
                )
                if (!subcommandDetails) return null
                return (
                  <li key={index} className="ml-4">
                    <RefInternalLink
                      href={`/reference/cli/${subcommandDetails.id}`}
                      sectionSlug={subcommandDetails.id}
                    >
                      {subcommandDetails.title}
                    </RefInternalLink>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        {(command.flags ?? []).length > 0 && (
          <>
            <h3 className="mb-3 text-base text-foreground">Flags</h3>
            <ul>
              {command.flags.map((flag, index) => (
                <li key={index} className="border-t last-of-type:border-b py-5 flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {flag.name}
                    </span>
                    <RequiredBadge isOptional={!flag.required} />
                  </div>
                  {flag.description && (
                    <ReactMarkdown className="prose break-words text-sm">
                      {flag.description}
                    </ReactMarkdown>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="overflow-auto">
        {'examples' in command &&
          Array.isArray(command.examples) &&
          command.examples.length > 0 && (
            <Tabs_Shadcn_ defaultValue={command.examples[0].id}>
              <TabsList_Shadcn_ className="flex-wrap gap-2 border-0">
                {command.examples.map((example) => (
                  <TabsTrigger_Shadcn_
                    key={example.id}
                    value={example.id}
                    className={cn(
                      'px-2.5 py-1 rounded-full',
                      'border-0 bg-surface-200 hover:bg-surface-300',
                      'text-xs text-foreground-lighter',
                      // Undoing styles from primitive component
                      'data-[state=active]:border-0 data-[state=active]:shadow-0',
                      'data-[state=active]:bg-foreground data-[state=active]:text-background',
                      'transition'
                    )}
                  >
                    {example.name}
                  </TabsTrigger_Shadcn_>
                ))}
              </TabsList_Shadcn_>
              {command.examples.map((example) => (
                <TabsContent_Shadcn_ key={example.id} value={example.id}>
                  <CodeBlock
                    language="bash"
                    className="p-4 rounded-md border"
                    wrapperClassName="mb-8"
                  >
                    {example.code}
                  </CodeBlock>
                  <h3 className="text-foreground-lighter text-sm mb-2">Response</h3>
                  <CodeBlock language="bash" className="p-4 rounded-md border">
                    {example.response}
                  </CodeBlock>
                </TabsContent_Shadcn_>
              ))}
            </Tabs_Shadcn_>
          )}
      </div>
    </RefSubLayout.Section>
  )
}

interface FunctionSectionProps {
  sdkId: string
  version: string
  link: string
  section: AbbrevApiReferenceSection
  useTypeSpec: boolean
}

async function FunctionSection({
  sdkId,
  version,
  link,
  section,
  useTypeSpec,
}: FunctionSectionProps) {
  const fns = await getFunctionsList(sdkId, version)

  const fn = fns.find((fn) => fn.id === section.id)
  if (!fn) return null

  let types: MethodTypes | undefined
  if (useTypeSpec && '$ref' in fn) {
    types = await getTypeSpec(fn['$ref'] as string)
  }

  const fullDescription = [
    types?.comment?.shortText,
    'description' in fn && (fn.description as string),
    'notes' in fn && (fn.notes as string),
  ]
    .filter(Boolean)
    .map(normalizeMarkdown)
    .join('\n\n')

  return (
    <RefSubLayout.Section columns="double" link={link} {...section}>
      <StickyHeader {...section} className="col-[1_/_-1]" />
      <div className="overflow-hidden flex flex-col gap-8">
        <div className="prose break-words text-sm">
          <MDXRemoteRefs source={fullDescription} />
        </div>
        <FnParameterDetails
          parameters={
            'overwriteParams' in fn
              ? (fn.overwriteParams as Array<object>).map((overwrittenParams) => ({
                  ...overwrittenParams,
                  __overwritten: true,
                }))
              : 'params' in fn
                ? (fn.params as Array<object>).map((param) => ({ ...param, __overwritten: true }))
                : types?.params
          }
          altParameters={types?.altSignatures?.map(({ params }) => params)}
          className="max-w-[80ch]"
        />
        {!!types?.ret && <ReturnTypeDetails returnType={types.ret} />}
      </div>
      <div className="overflow-auto">
        {'examples' in fn && Array.isArray(fn.examples) && fn.examples.length > 0 && (
          <Tabs_Shadcn_ defaultValue={fn.examples[0].id}>
            <TabsList_Shadcn_ className="flex-wrap gap-2 border-0">
              {fn.examples.map((example) => (
                <TabsTrigger_Shadcn_
                  key={example.id}
                  value={example.id}
                  className={cn(
                    'px-2.5 py-1 rounded-full',
                    'border-0 bg-surface-200 hover:bg-surface-300',
                    'text-xs text-foreground-lighter',
                    // Undoing styles from primitive component
                    'data-[state=active]:border-0 data-[state=active]:shadow-0',
                    'data-[state=active]:bg-foreground data-[state=active]:text-background',
                    'transition'
                  )}
                >
                  {example.name}
                </TabsTrigger_Shadcn_>
              ))}
            </TabsList_Shadcn_>
            {fn.examples.map((example) => (
              <TabsContent_Shadcn_ key={example.id} value={example.id}>
                <MDXRemoteRefs source={example.code} />
                <div className="flex flex-col gap-2">
                  {!!example.data?.sql && (
                    <CollapsibleDetails title="Data source" content={example.data.sql} />
                  )}
                  {!!example.response && (
                    <CollapsibleDetails title="Response" content={example.response} />
                  )}
                  {!!example.description && (
                    <CollapsibleDetails
                      title="Notes"
                      content={normalizeMarkdown(example.description)}
                    />
                  )}
                </div>
              </TabsContent_Shadcn_>
            ))}
          </Tabs_Shadcn_>
        )}
      </div>
    </RefSubLayout.Section>
  )
}

export { RefSections }

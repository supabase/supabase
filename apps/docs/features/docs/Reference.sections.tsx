import { Fragment } from 'react'

import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, cn } from 'ui'

import { REFERENCES } from '~/content/navigation.references'
import { getRefMarkdown, MDXRemoteRefs } from '~/features/docs/Reference.mdx'
import { MDXProviderReference } from '~/features/docs/Reference.mdx.client'
import type { MethodTypes } from '~/features/docs/Reference.typeSpec'
import {
  getFlattenedSections,
  getFunctionsList,
  getTypeSpec,
} from '~/features/docs/Reference.generated.singleton'
import {
  CollapsibleDetails,
  FnParameterDetails,
  RefSubLayout,
  ReturnTypeDetails,
  StickyHeader,
} from '~/features/docs/Reference.ui'
import type { AbbrevCommonClientLibSection } from '~/features/docs/Reference.utils'
import { normalizeMarkdown } from '~/features/docs/Reference.utils'

type ClientLibRefSectionsProps = {
  sdkId: string
  version: string
} & (
  | { isCrawlerPage?: false; requestedSection?: undefined }
  | { isCrawlerPage: true; requestedSection: string }
)

async function ClientLibRefSections({ sdkId, version }: ClientLibRefSectionsProps) {
  const flattenedSections = await getFlattenedSections(sdkId, version)
  trimIntro(flattenedSections)

  return (
    <MDXProviderReference>
      <div className="flex flex-col my-16 gap-16">
        {flattenedSections
          .filter((section) => section.type !== 'category')
          .map((section, idx) => (
            <Fragment key={`${section.id}-${idx}`}>
              <SectionDivider />
              <SectionSwitch sdkId={sdkId} version={version} section={section} />
            </Fragment>
          ))}
      </div>
    </MDXProviderReference>
  )
}

function trimIntro(sections: Array<AbbrevCommonClientLibSection>) {
  const hasIntro = sections[0]?.type === 'markdown' && sections[0]?.slug === 'introduction'
  if (hasIntro) {
    sections.shift()
  }
}

function SectionDivider() {
  return <hr />
}

type SectionSwitchProps = {
  sdkId: string
  version: string
  section: AbbrevCommonClientLibSection
  isCrawlerPage?: boolean
}

export function SectionSwitch({ sdkId, version, section, isCrawlerPage }: SectionSwitchProps) {
  const libPath = REFERENCES[sdkId].libPath
  const isLatestVersion = version === REFERENCES[sdkId].versions[0]

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
          isCrawlerPage={isCrawlerPage}
        />
      )
    case 'function':
      return (
        <FunctionSection
          sdkId={sdkId}
          version={version}
          link={sectionLink}
          section={section}
          useTypeSpec={REFERENCES[sdkId].typeSpec}
          isCrawlerPage={isCrawlerPage}
        />
      )
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
  section: AbbrevCommonClientLibSection
  isCrawlerPage?: boolean
}

async function MarkdownSection({
  libPath,
  version,
  isLatestVersion,
  link,
  section,
  isCrawlerPage = false,
}: MarkdownSectionProps) {
  const content = await getRefMarkdown(
    section.meta?.shared
      ? `shared/${section.id}`
      : `${libPath}/${isLatestVersion ? '' : `${version}/`}${section.id}`
  )

  return (
    <RefSubLayout.EducationSection link={link} {...section}>
      <StickyHeader {...section} isCrawlerPage={isCrawlerPage} />
      <MDXRemoteRefs source={content} />
    </RefSubLayout.EducationSection>
  )
}

interface FunctionSectionProps {
  sdkId: string
  version: string
  link: string
  section: AbbrevCommonClientLibSection
  useTypeSpec: boolean
  isCrawlerPage?: boolean
}

async function FunctionSection({
  sdkId,
  version,
  link,
  section,
  useTypeSpec,
  isCrawlerPage = false,
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
      <StickyHeader {...section} isCrawlerPage={isCrawlerPage} className="col-[1_/_-1]" />
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
            {'examples' in fn &&
              Array.isArray(fn.examples) &&
              fn.examples.map((example) => (
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

export { ClientLibRefSections }

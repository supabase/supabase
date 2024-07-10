import type { AbbrevCommonClientLibSection } from '~/features/docs/Reference.utils'
import type { MethodTypes } from '~/features/docs/Reference.typeSpec'

import { Fragment } from 'react'

import { getRefMarkdown, MDXRemoteRefs } from '~/features/docs/Reference.mdx'
import { getTypeSpec } from '~/features/docs/Reference.typeSpec'
import { RefSubLayout } from '~/features/docs/Reference.ui'
import { StickyHeader } from './Reference.ui.client'
import { genClientSdkSectionTree, getSpecFnsCached } from '~/features/docs/Reference.utils'

interface ClientLibRefSectionsProps {
  libPath: string
  specFile: string
  excludeName: string
  useTypeSpec: boolean
}

async function ClientLibRefSections({
  libPath,
  specFile,
  excludeName,
  useTypeSpec,
}: ClientLibRefSectionsProps) {
  const sectionTree = await genClientSdkSectionTree(specFile, excludeName)
  const flattenedSections = flattenSections(sectionTree)

  trimIntro(flattenedSections)

  return (
    <div className="flex flex-col my-16 gap-16">
      {flattenedSections.map((section, idx) => (
        <Fragment key={`${section.id}-${idx}`}>
          <SectionDivider />
          <SectionSwitch
            libPath={libPath}
            section={section}
            specFile={specFile}
            useTypeSpec={useTypeSpec}
          />
        </Fragment>
      ))}
    </div>
  )
}

function flattenSections(tree: Array<AbbrevCommonClientLibSection>) {
  return tree.reduce((acc, elem) => {
    if ('items' in elem) {
      const prunedElem = { ...elem }
      delete prunedElem.items
      acc.push(prunedElem)
      acc.push(...flattenSections(elem.items))
    } else {
      acc.push(elem)
    }

    return acc
  }, [] as Array<AbbrevCommonClientLibSection>)
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

interface SectionSwitchProps {
  libPath: string
  section: AbbrevCommonClientLibSection
  specFile: string
  useTypeSpec: boolean
}

function SectionSwitch({ libPath, section, specFile, useTypeSpec }: SectionSwitchProps) {
  const sectionLink = `/docs/reference/${libPath}/${section.slug}`

  switch (section.type) {
    case 'markdown':
      return <MarkdownSection libPath={libPath} link={sectionLink} section={section} />
    case 'function':
      return (
        <FunctionSection
          link={sectionLink}
          section={section}
          specFile={specFile}
          useTypeSpec={useTypeSpec}
        />
      )
    case 'category':
      return null
    default:
      console.error(`Unhandled type in reference sections: ${section.type}`)
      return null
  }
}

interface MarkdownSectionProps {
  libPath: string
  link: string
  section: AbbrevCommonClientLibSection
}

async function MarkdownSection({ libPath, link, section }: MarkdownSectionProps) {
  const content = await getRefMarkdown(
    section.meta?.shared ? `shared/${section.id}` : `${libPath}/${section.id}`
  )

  return (
    <RefSubLayout.EducationSection {...section}>
      <StickyHeader {...section} link={link} scrollSpyHeader />
      <MDXRemoteRefs source={content} />
    </RefSubLayout.EducationSection>
  )
}

interface FunctionSectionProps {
  link: string
  section: AbbrevCommonClientLibSection
  specFile: string
  useTypeSpec: boolean
}

async function FunctionSection({ link, section, specFile, useTypeSpec }: FunctionSectionProps) {
  const fns = await getSpecFnsCached(specFile)

  const fn = fns.find((fn) => fn.id === section.id)
  if (!fn) return null

  let types: MethodTypes
  if (useTypeSpec && '$ref' in fn) {
    types = await getTypeSpec(fn['$ref'] as string)
  }

  return (
    <RefSubLayout.Section {...section}>
      <StickyHeader {...section} link={link} scrollSpyHeader />
      <pre>{JSON.stringify(fn, null, 2)}</pre>
      <pre>{JSON.stringify(types, null, 2)}</pre>
    </RefSubLayout.Section>
  )
}

export { ClientLibRefSections }

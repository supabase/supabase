import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { getRefMarkdown } from '~/features/docs/Reference.mdx'
import { ReferenceSectionWrapper } from '~/features/docs/Reference.ui.client'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }

function hasIntro(sections: typeof commonClientLibSections, excludeName: string) {
  return Boolean(
    sections[0]?.type === 'markdown' &&
      sections[0]?.slug === 'introduction' &&
      !(
        'excludes' in sections &&
        Array.isArray(sections.excludes) &&
        sections.excludes?.includes(excludeName)
      )
  )
}

interface ClientLibIntroductionProps {
  libPath: string
  excludeName: string
}

async function ClientLibIntroduction({ libPath, excludeName }: ClientLibIntroductionProps) {
  if (!hasIntro(commonClientLibSections, excludeName)) return null

  const content = await getRefMarkdown(`${libPath}/introduction`)

  return (
    <ReferenceSectionWrapper
      id="introduction"
      link={`/docs/reference/${libPath}/introduction`}
      className="prose"
    >
      <MDXRemoteBase source={content} />
    </ReferenceSectionWrapper>
  )
}

export { ClientLibIntroduction }

import { GuideTemplate } from '~/app/guides/GuideTemplate'

import { genGuidesStaticParams, getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const FunctionsGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('functions', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

const generateStaticParams = genGuidesStaticParams('functions')

export default FunctionsGuide
export { generateStaticParams }

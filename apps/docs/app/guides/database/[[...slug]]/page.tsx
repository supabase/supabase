import { GuideTemplate } from '~/app/guides/GuideTemplate'

import { genGuidesStaticParams, getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const DatabaseGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('database', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

const generateStaticParams = genGuidesStaticParams('database')

export default DatabaseGuide
export { generateStaticParams }

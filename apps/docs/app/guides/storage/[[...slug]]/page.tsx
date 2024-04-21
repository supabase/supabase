import { GuideTemplate } from '~/app/guides/GuideTemplate'

import { genGuidesStaticParams, getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const StorageGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('storage', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

const generateStaticParams = genGuidesStaticParams('storage')

export default StorageGuide
export { generateStaticParams }

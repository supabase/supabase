import { GuideTemplate } from '~/app/guides/GuideTemplate'

import { genGuidesStaticParams, getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const RealtimeGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('realtime', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

const generateStaticParams = genGuidesStaticParams('realtime')

export default RealtimeGuide
export { generateStaticParams }

import { GuideTemplate } from '~/app/GuideTemplate'

import { getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const RealtimeGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('realtime', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

export default RealtimeGuide

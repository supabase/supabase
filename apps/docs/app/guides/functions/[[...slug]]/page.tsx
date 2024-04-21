import { GuideTemplate } from '~/app/GuideTemplate'

import { getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const FunctionsGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('functions', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

export default FunctionsGuide

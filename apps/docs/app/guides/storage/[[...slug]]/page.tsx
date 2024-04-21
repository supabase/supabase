import { GuideTemplate } from '~/app/GuideTemplate'

import { getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const StorageGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('storage', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

export default StorageGuide

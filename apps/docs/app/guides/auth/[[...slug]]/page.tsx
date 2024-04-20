import { GuideTemplate } from '~/app/GuideTemplate'

import { getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const AuthGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('auth', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

export default AuthGuide

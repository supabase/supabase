import { GuideTemplate } from '~/app/guides/GuideTemplate'

import { genGuidesStaticParams, getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'

const AuthGuide = async ({ params }: { params: { slug?: string[] } }) => {
  const { frontmatter, ...data } = await getGuidesMarkdown('auth', params)

  return <GuideTemplate meta={frontmatter} {...data} />
}

const generateStaticParams = genGuidesStaticParams('auth')

export default AuthGuide
export { generateStaticParams }

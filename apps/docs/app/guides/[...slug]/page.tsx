import { genGuidesStaticParams, getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'
import { GuideTemplate } from '../GuideTemplate'

const GuidePage = async ({ params }: { params: { slug: string[] } }) => {
  const data = await getGuidesMarkdown(params)
  return <GuideTemplate {...data} />
}

const generateStaticParams = genGuidesStaticParams()

export default GuidePage
export { generateStaticParams }

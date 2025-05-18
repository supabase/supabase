import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'

export const dynamicParams = false

type Params = { slug?: string[] }

const AuthGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['auth', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams('auth')
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['auth', ...(params.slug ?? [])])
)

export default AuthGuidePage
export { generateStaticParams, generateMetadata }

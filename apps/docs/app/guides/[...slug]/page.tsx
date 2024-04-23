import { redirect } from 'next/navigation'
import { sep } from 'node:path'
import { genGuidesStaticParams, getGuidesMarkdown } from '~/features/docs/guides/GuidesMdx'
import { GuideTemplate } from '../GuideTemplate'

const GuidePage = async ({ params }: { params: { slug: string[] } }) => {
  let notFound = false
  let data: Awaited<ReturnType<typeof getGuidesMarkdown>>

  /**
   * This indirection is necessary because redirects operate by throwing, so
   * we cannot redirect within the catch block.
   */
  try {
    data = await getGuidesMarkdown(params)
  } catch {
    notFound = true
  }

  if (notFound) {
    const searchParams = new URLSearchParams({ page: encodeURIComponent(params.slug.join(sep)) })
    redirect(`/not-found?${searchParams}`)
  }

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams()

export default GuidePage
export { generateStaticParams }

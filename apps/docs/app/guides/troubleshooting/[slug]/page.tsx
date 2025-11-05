import { notFound } from 'next/navigation'

import TroubleshootingPage from '~/features/docs/Troubleshooting.page'
import { getAllTroubleshootingEntries, getArticleSlug } from '~/features/docs/Troubleshooting.utils'
import { PROD_URL } from '~/lib/constants'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'

export const dynamicParams = false

const { metadataTitle } = getCustomContent(['metadata:title'])

export default async function TroubleshootingEntryPage(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params

  const { slug } = params

  const allTroubleshootingEntries = await getAllTroubleshootingEntries()
  const entry = allTroubleshootingEntries.find((entry) => getArticleSlug(entry) === slug)

  if (!entry) {
    notFound()
  }

  return <TroubleshootingPage entry={entry} />
}

export const generateMetadata = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params

  const { slug } = params

  const allTroubleshootingEntries = await getAllTroubleshootingEntries()
  const entry = allTroubleshootingEntries.find((entry) => getArticleSlug(entry) === slug)

  return {
    title: `${metadataTitle || 'Supabase'} | Troubleshooting${entry ? ` | ${entry.data.title}` : ''}`,
    alternates: {
      canonical: `${PROD_URL}/guides/troubleshooting/${slug}`,
    },
  }
}

export const generateStaticParams = async () => {
  const allTroubleshootingEntries = await getAllTroubleshootingEntries()
  return allTroubleshootingEntries.map((entry) => ({ slug: getArticleSlug(entry) }))
}

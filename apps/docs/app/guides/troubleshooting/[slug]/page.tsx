import { redirect } from 'next/navigation'
import TroubleshootingPage from '~/features/docs/Troubleshooting.page'
import { getAllTroubleshootingEntries, getArticleSlug } from '~/features/docs/Troubleshooting.utils'
import { notFoundLink } from '~/features/recommendations/NotFound.utils'

export default async function TroubleshootingEntryPage({
  params: { slug },
}: {
  params: { slug: string }
}) {
  const allTroubleshootingEntries = await getAllTroubleshootingEntries()
  const entry = allTroubleshootingEntries.find((entry) => getArticleSlug(entry.data) === slug)

  if (!entry) {
    throw redirect(notFoundLink(`troubleshooting/${slug}`))
  }

  return <TroubleshootingPage entry={entry} />
}

export const generateMetadata = async ({ params: { slug } }: { params: { slug: string } }) => {
  const allTroubleshootingEntries = await getAllTroubleshootingEntries()
  const entry = allTroubleshootingEntries.find((entry) => getArticleSlug(entry.data) === slug)

  return {
    title: 'Supabase Docs | Troubleshooting' + (entry ? ` | ${entry.data.title}` : ''),
  }
}

export const generateStaticParams = async () => {
  const allTroubleshootingEntries = await getAllTroubleshootingEntries()
  return allTroubleshootingEntries.map((entry) => ({ slug: getArticleSlug(entry.data) }))
}

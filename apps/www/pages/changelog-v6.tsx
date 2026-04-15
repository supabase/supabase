import { ChangelogV6Explorer } from '~/components/Changelog/ChangelogV6Explorer'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import type { ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { getChangelogTimelineSortedIndex } from '~/lib/changelog-github'
import type { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'

type PageProps = {
  changelogIndex: ChangelogTimelineIndexItem[]
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')
  try {
    const changelogIndex = await getChangelogTimelineSortedIndex()
    return { props: { changelogIndex } }
  } catch (e) {
    console.error(e)
    return { props: { changelogIndex: [] } }
  }
}

export default function ChangelogV6Page({ changelogIndex }: PageProps) {
  return (
    <>
      <NextSeo
        title="Changelog"
        description="New updates and improvements to Supabase"
        openGraph={{
          title: 'Changelog',
          url: 'https://supabase.com/changelog-v6',
          type: 'article',
        }}
      />
      <DefaultLayout>
        <NuqsAdapter>
          <div className="container mx-auto max-w-2xl px-4 py-10 sm:px-16 xl:px-20">
            <ChangelogV6Explorer items={changelogIndex} />
          </div>
        </NuqsAdapter>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

import { ChangelogV5Explorer } from '~/components/Changelog/ChangelogV5Explorer'
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

export default function ChangelogV5TimelinePage({ changelogIndex }: PageProps) {
  return (
    <>
      <NextSeo
        title="Changelog"
        description="New updates and improvements to Supabase"
        openGraph={{
          title: 'Changelog (v5 bottom timeline)',
          url: 'https://supabase.com/changelog-v5',
          type: 'article',
        }}
      />
      <DefaultLayout>
        <NuqsAdapter>
          <div
            className="
              mx-auto flex flex-col
              gap-8
              px-4 py-10 sm:px-16
              xl:px-20
            "
          >
            <ChangelogV5Explorer items={changelogIndex} />
          </div>
        </NuqsAdapter>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

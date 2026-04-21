import { ChangelogMonthTabExplorer } from '~/components/Changelog/ChangelogMonthTabExplorer'
import { ChangelogRssButton } from '~/components/Changelog/ChangelogRssButton'
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

export default function ChangelogV4MonthTabsPage({ changelogIndex }: PageProps) {
  return (
    <>
      <NextSeo
        title="Changelog"
        description="New updates and improvements to Supabase"
        openGraph={{
          title: 'Changelog',
          url: 'https://supabase.com/changelog-v4',
          type: 'article',
        }}
      />
      <DefaultLayout>
        <NuqsAdapter>
          <div className="container mx-auto max-w-5xl flex flex-col gap-6 px-4 py-10 sm:px-16 xl:px-20">
            <div>
              <h1 className="h1">Changelog</h1>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-foreground-lighter text-lg">
                  New updates and product improvements
                </p>
                <ChangelogRssButton />
              </div>
            </div>

            <ChangelogMonthTabExplorer items={changelogIndex} />
          </div>
        </NuqsAdapter>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

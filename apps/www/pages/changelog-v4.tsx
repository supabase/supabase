import { ChangelogMonthTabExplorer } from '~/components/Changelog/ChangelogMonthTabExplorer'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import type { ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { getChangelogTimelineSortedIndex } from '~/lib/changelog-github'
import type { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'

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
        title="Changelog (v4 — month tabs)"
        description="Experimental month tabs with sticky tab strip"
        openGraph={{
          title: 'Changelog (v4 month tabs)',
          url: 'https://supabase.com/changelog-v4',
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div className="container mx-auto max-w-5xl flex flex-col gap-6 px-4 py-10 sm:px-16 xl:px-20">
          <div>
            <h1 className="h1">Changelog</h1>
            <p className="text-foreground-lighter mt-2 text-lg">
              Month tabs experiment — strip stays sticky while you scroll. Full entries load for
              the selected month (same MDX as the main changelog).{' '}
              <Link href="/changelog-v3" className="text-brand-link hover:underline">
                v3 timeline
              </Link>
              {' · '}
              <Link href="/changelog-v3-modal" className="text-brand-link hover:underline">
                v3 modal
              </Link>
              .
            </p>
          </div>

          <ChangelogMonthTabExplorer items={changelogIndex} />
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

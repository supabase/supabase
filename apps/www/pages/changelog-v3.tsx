import { ChangelogRssButton } from '~/components/Changelog/ChangelogRssButton'
import { ChangelogV3TimelineList } from '~/components/Changelog/ChangelogV3TimelineList'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import type { ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { getChangelogTimelineSortedIndex } from '~/lib/changelog-github'
import type { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'

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

function ChangelogV3Page({ changelogIndex }: PageProps) {
  const visible = changelogIndex.filter((item) => !item.title.includes('[d]'))

  return (
    <>
      <NextSeo
        title="Changelog"
        description="New updates and improvements to Supabase"
        openGraph={{
          title: 'Changelog',
          url: 'https://supabase.com/changelog-v3',
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div className="container mx-auto max-w-3xl flex flex-col gap-6 px-4 py-10 sm:px-16 xl:px-20">
          <div>
            <h1 className="h1">Changelog</h1>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-foreground-lighter text-lg">
                New updates and product improvements
              </p>
              <ChangelogRssButton />
            </div>
          </div>

          <section aria-label="Changelog entries">
            {visible.length === 0 ? (
              <p className="text-foreground-lighter text-sm">No entries loaded.</p>
            ) : (
              <ChangelogV3TimelineList
                items={visible}
                mode="link"
                hrefFor={(item) => `/changelog-v3/${item.number}`}
              />
            )}
          </section>

          <p className="text-foreground-lighter text-sm">
            Prefer GitHub? Discussions stay the{' '}
            <a
              href="https://github.com/orgs/supabase/discussions/categories/changelog"
              className="text-brand-link"
            >
              source of truth
            </a>
            .
          </p>
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default ChangelogV3Page

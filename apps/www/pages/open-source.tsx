import 'swiper/css'

import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import OSSHero from '~/components/OpenSource/OSSHero'
import Repos, { type GitHubRepo } from '~/components/OpenSource/Repos'
import Sponsorships from '~/components/OpenSource/Sponsorships'
import ProductHeaderCentered from '~/components/Sections/ProductHeaderCentered'
import pageData from '~/data/open-source'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'

const OpenSource = ({ repos }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const router = useRouter()

  const meta_title = pageData.metaTitle || 'Open Source | Supabase'
  const meta_description =
    pageData.metaDescription ||
    'Supabase is an open source company, supporting existing open source tools and communities wherever possible.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/supabase-og.png`,
            },
          ],
        }}
      />
      <DefaultLayout className="relative">
        <SectionContainer className="overflow-hidden relative mx-auto py-0! sm:py-0! md:py-4! lg:pt-16! lg:pb-12!">
          <ProductHeaderCentered {...pageData.heroSection} />
        </SectionContainer>
        <OSSHero />
        <SectionContainer className="pt-0!">
          <Repos tabs={pageData.repo_tabs} initialRepos={repos} />
        </SectionContainer>
        <SectionContainer className="py-0!">
          <div className="w-full border-b" />
        </SectionContainer>
        <SectionContainer>
          <Sponsorships sponsorships={pageData.sponsorships} />
        </SectionContainer>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

async function fetchSupabaseRepos(): Promise<GitHubRepo[] | null> {
  try {
    const res = await fetch('https://api.github.com/orgs/supabase/repos?type=public&per_page=100', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`)

    const data: unknown = await res.json()
    if (!Array.isArray(data)) throw new Error('GitHub returned a non-array body')

    const tabRepoNames = new Set(pageData.repo_tabs.flatMap((tab) => tab.repos ?? []))

    return data
      .filter((repo) => tabRepoNames.has(repo.name))
      .map((repo) => ({
        name: repo.name,
        description: repo.description ?? null,
        html_url: repo.html_url,
        full_name: repo.full_name,
        forks: repo.forks ?? 0,
        stargazers_count: repo.stargazers_count ?? 0,
      }))
  } catch (error) {
    console.error('Failed to fetch supabase repos for /open-source', error)
    return null
  }
}

export const getStaticProps: GetStaticProps<{ repos: GitHubRepo[] | null }> = async () => {
  const repos = await fetchSupabaseRepos()
  return {
    props: { repos },
    revalidate: repos ? 3600 : 60,
  }
}

export default OpenSource

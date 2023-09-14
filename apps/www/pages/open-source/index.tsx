import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Octokit } from '@octokit/core'
import { NextSeo } from 'next-seo'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import OSSHero from '~/components/OpenSource/OSSHero'
import ProductHeaderCentered from '~/components/Sections/ProductHeaderCentered'
import Repos from '~/components/OpenSource/Repos'
import Sponsorships from '~/components/OpenSource/Sponsorships'

import pageData from '~/data/open-source'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'
import CTABanner from '../../components/CTABanner'

const OpenSource = () => {
  const octokit = new Octokit()
  const [repos, setRepos] = useState([{}])

  useEffect(() => {
    async function fetchOctoData() {
      const res = await octokit.request('GET /orgs/{org}/repos', {
        org: 'supabase',
        type: 'public',
        per_page: 200,
        page: 1,
      })

      setRepos(res.data)
    }
    fetchOctoData()
  }, [])

  const router = useRouter()

  const meta_title = pageData.metaTitle || 'Open Source | Supabase'
  const meta_description =
    pageData.metaDescription ||
    'Supabase is an open source company, supporting existing open source tools and communities wherever possible.'
  const totalStars = repos.reduce((acc: number, val: any) => acc + val.stargazers_count, 0)

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
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout className="relative">
        <SectionContainer className="overflow-hidden pt-8 pb-12 md:pt-12">
          <ProductHeaderCentered className="-mb-14" {...pageData.heroSection} />
        </SectionContainer>
        <OSSHero />
        <SectionContainer className="!pt-0">
          <Repos repos={repos} tabs={pageData.repo_tabs} />
        </SectionContainer>
        <SectionContainer className="!py-0">
          <div className="w-full  bg-scale-400 border-b" />
        </SectionContainer>
        <SectionContainer>
          <Sponsorships sponsorships={pageData.sponsorships} />
        </SectionContainer>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default OpenSource

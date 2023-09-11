import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Octokit } from '@octokit/core'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import maintainers from '~/data/maintainers.json'
import Sponsors from '~/components/Sponsors'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import ProductHeaderCentered from '../../components/Sections/ProductHeaderCentered'
import pageData from '~/data/open-source'
import Repos from '../../components/OpenSource/Repos'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'

const OpenSource = () => {
  const octokit = new Octokit()
  const [repos, setRepos] = useState([{}])

  const maintainerTags = maintainers
    .reduce((acc: any, x: any) => acc.concat(x.tags), []) // get all tags
    .filter((v: any, i: any, a: any) => a.indexOf(v) === i) // remove duplicates
    .sort((a: any, b: any) => a.localeCompare(b)) // alphabetical
  const maintainerPills = ['All'].concat(maintainerTags)

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

  console.log(repos)
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
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer className="overflow-hidden pt-8 pb-12 md:pt-12">
          <ProductHeaderCentered className="-mb-14" {...pageData.heroSection} />
        </SectionContainer>
        <SectionContainer className="!pt-0">
          <Repos repos={repos} tabs={pageData.repo_tabs} title="Yooo" paragraph="asfd" />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default OpenSource

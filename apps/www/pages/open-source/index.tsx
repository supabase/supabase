import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Octokit } from '@octokit/core'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import maintainers from '~/data/maintainers.json'
import sponsors from '~/data/sponsors.json'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { Tabs, IconStar } from 'ui'

const OpenSource = () => {
  const [repos, setRepos] = useState([{}])
  const octokit = new Octokit()

  const tags: string[] = []
  tags.push('All')
  maintainers.forEach((item) => {
    item.tags.forEach((tag) => {
      if (!tags.includes(tag)) {
        tags.push(tag)
      }
    })
  })

  useEffect(() => {
    async function fetchOctoData() {
      const res = await octokit.request('GET /orgs/{org}/repos', {
        org: 'supabase',
        type: 'public',
        per_page: 6,
        page: 1,
      })
      setRepos(res.data)
    }
    fetchOctoData()
  }, [])

  const tiers = [
    {
      tier_name: '$5,000 a month',
      heading: 'Enterprise: $5,000 per month',
      transactions: sponsors.filter((x) => x.tier == '$5,000 a month'),
    },
    {
      tier_name: '$2,500 a month',
      heading: 'Agency: $2,500 per month',
      transactions: sponsors.filter((x) => x.tier == '$2,500 a month'),
    },
    {
      tier_name: '$1,000 a month',
      heading: 'Startup: $1,000 per month',
      transactions: sponsors.filter((x) => x.tier == '$1,000 a month'),
    },
    {
      tier_name: '$49 a month',
      heading: 'Evangelist: $49 per month',
      transactions: sponsors.filter((x) => x.tier == '$49 a month'),
    },
    {
      tier_name: '$19 a month',
      heading: 'Supporter: $19 per month',
      transactions: sponsors.filter((x) => x.tier == '$19 a month'),
    },
    {
      tier_name: '$5 a month',
      heading: 'Contributor: $5 per month',
      transactions: sponsors.filter((x) => x.tier == '$5 a month'),
    },
  ]

  const router = useRouter()

  const meta_title = 'Open Source | Supabase'
  const meta_description =
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
              url: `https://supabase.com/images/og/og-image.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer>
          <div className="container">
            <div className="text-center space-y-3">
              <span className="uppercase text-brand-900">The Power of Collaboration</span>
              <h1 className="text-4xl">Open Source Community</h1>
              <p className="w-[45%] mx-auto text-sm text-scale-1100">
                Supabase is an open source company, actively fostering collaboration and supporting
                existing open source tools and communities.
              </p>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer>
          <div className="text-center space-y-2">
            <h2 className="text-2xl">Sponsor Appreciation</h2>
            <p className="w-[40%] mx-auto text-scale-1100 text-sm pb-8">
              Thanks to our sponsors we're able to advance our open source mission. Their support
              fuels our development, fosters collaboration, and empowers us to shape a more open and
              accessible future.
            </p>
            <div>
              {tiers.map(
                (t: any, i: number) =>
                  !!t.transactions.length && (
                    <div key={i} className="mt-8">
                      <h3 className="font-bold mb-6">{t.heading}</h3>
                      <div className="grid grid-cols-3 gap-6">
                        {t.transactions.map((x: any, i: number) => (
                          <Link key={i} href={`https://github.com/${x.sponsor}`}>
                            <div className="rounded-2xl bg-scale-300 border-[1px] border-scale-400 p-6 cursor-pointer flex items-center space-x-3">
                              <Image
                                className="mt-4 mb-4 rounded-full w-12 h-12"
                                src={`https://github.com/${x.sponsor}.png`}
                                alt={`${x.sponsor} avatar`}
                                width={45}
                                height={45}
                              />
                              <h4>{x.sponsor}</h4>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="w-full h-[1px] bg-scale-400 rounded-full mt-6"></div>
                    </div>
                  )
              )}
            </div>
          </div>
        </SectionContainer>

        <SectionContainer>
          <div className="text-center space-y-2">
            <h2 className="text-2xl">Community Maintainers</h2>
            <p className="w-[50%] mx-auto text-scale-1100 text-sm pb-8">
              Thanks to our dedicated community maintainers, we're able to propel our open source
              mission forward. Their unwavering commitment drives our development, nurtures
              collaboration, and empowers us to forge a more inclusive and accessible future.
            </p>
          </div>
          <div className="mt-8">
            <Tabs size="medium" block>
              {tags.map((tag: string, i: number) => (
                <Tabs.Panel id={tag} label={tag} key={i}>
                  <div className="grid grid-cols-2 gap-6">
                    {maintainers
                      .filter((x) => tag == 'All' || x.tags.includes(tag))
                      .sort((a, b) => a.handle.localeCompare(b.handle))
                      .map((x, i) => (
                        <Link key={i} href={`https://github.com/${x.handle}`}>
                          <div className="rounded-2xl bg-scale-300 border-[1px] border-scale-400 p-6 cursor-pointer flex items-center space-x-3">
                            <Image
                              className="mt-4 mb-4 rounded-full w-12 h-12"
                              src={`https://github.com/${x.handle}.png`}
                              alt={`${x.handle} avatar`}
                              width={45}
                              height={45}
                            />
                            <div>
                              <h4>{x.handle}</h4>
                              <p className="text-scale-1100 text-xs">{x.description}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                </Tabs.Panel>
              ))}
            </Tabs>
          </div>
        </SectionContainer>

        <SectionContainer>
          <h2 className="text-2xl">Repositories</h2>
          <div className="grid grid-cols-3 gap-6 mt-6">
            {repos.length < 1 && <div></div>}
            {repos.length >= 1 &&
              repos.map((repo: any, i: number) => (
                <Link key={i} href={`${repo.html_url}`}>
                  <div className="rounded-2xl bg-scale-300 border-[1px] border-scale-400 p-6 py-4 cursor-pointer h-[140px] relative">
                    <div>
                      <h4 className="text-lg">{repo.name}</h4>
                      <p className="text-scale-1100 text-sm">{repo.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 text-scale-1100 text-xs absolute bottom-0 right-0 pr-6 pb-4">
                      <IconStar size={12} />
                      <span>{repo.stargazers_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default OpenSource

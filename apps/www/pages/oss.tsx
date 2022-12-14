import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Octokit } from '@octokit/core'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import maintainers from '../data/maintainers.json'
import Sponsors from '../components/Sponsors'
import Image from 'next/image'
import { NextSeo } from 'next-seo'

export default function Oss() {
  const octokit = new Octokit()

  const [activePill, setActivePill] = useState('All')
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
        per_page: 6,
        page: 1,
      })
      setRepos(res.data)
    }
    fetchOctoData()
  }, [])

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
        <div className="text-scale-1200 container mx-auto">
          <SectionContainer>
            <div className="container">
              <div className="flex items-center mb-16">
                <div className="col">
                  <h1 className="mb-10 text-4xl font-medium">Open source</h1>
                  <p className="max-w-xl">
                    Supabase is an open source company, supporting existing open source tools and
                    communities wherever possible.
                  </p>
                </div>
              </div>
              <h2 className="mb-6 text-2xl font-medium">Sponsors</h2>
              <Sponsors />
            </div>
          </SectionContainer>

          <SectionContainer>
            <div className="">
              <h2 className="mb-6 text-2xl font-medium">Community Maintainers</h2>

              <div className="overflow-auto md:max-w-none hidden sm:block">
                <ul className="flex 2xl:gap-4 items-center p-0">
                  {maintainerPills.map((x) => (
                    <li
                      key={x}
                      className={`mx-4 rounded-t-lg inline-block p-2 cursor-pointer hover:text-brand-800 ${
                        activePill == x ? 'bg-gray-200 dark:bg-gray-400 text-brand-800' : ''
                      }`}
                      onClick={() => setActivePill(x)}
                    >
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                {maintainers
                  .filter((x) => activePill == 'All' || x.tags.includes(activePill))
                  .sort((a, b) => a.handle.localeCompare(b.handle))
                  .map((x, idx) => (
                    <div className="" key={idx}>
                      <a
                        className="flex gap-4"
                        href={`https://github.com/${x.handle}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="grow bg-gray-300 dark:bg-gray-400 p-4 rounded-lg">
                          <div className="flex gap-4 shrink-0">
                            <Image
                              className="rounded-full my-0"
                              width={50}
                              height={50}
                              layout="fixed"
                              alt={x.handle}
                              src={`https://github.com/${x.handle}.png`}
                            />
                            <div className="">
                              <h4 className="text-lg my-0">@{x.handle}</h4>
                              <span className="text-sm">{x.description}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          </SectionContainer>

          {/* OSS */}
          <SectionContainer>
            <div>
              <h2 className="mb-6 text-2xl font-medium">Repositories</h2>
              <div className="grid gap-4">
                {repos.length < 1 && <div></div>}
                {repos.length >= 1 &&
                  repos.map((props: any, idx: any) => (
                    <div className="bg-gray-300 dark:bg-gray-400 p-4 rounded-lg" key={idx}>
                      <a className="h-full" href={props.html_url}>
                        <div className="card__body">
                          <h4 className="uppercase my-2 font-semibold">{props.name}</h4>
                          <span className="text-sm">{props.description}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between py-2 text-xs">
                          <div>@{props.full_name}</div>
                          <div>{props.stargazers_count} ★</div>
                        </div>
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          </SectionContainer>
        </div>
      </DefaultLayout>
    </>
  )
}

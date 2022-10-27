import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { GetServerSideProps, NextPage } from 'next'
import DefaultLayout from '~/components/Layouts/Default'
// import Image from 'next/image'
import Link from 'next/link'
import { Button, IconCheck, Badge } from '@supabase/ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ReactMarkdown from 'react-markdown'
import career from '../../data/career.json'
import Globe from '~/components/Globe'
import Styles from './career.module.css'

export const getServerSideProps: GetServerSideProps = async () => {
  const job_res = await fetch('https://boards-api.greenhouse.io/v1/boards/supabase/jobs')
  const job_data = await job_res.json()

  const contributor_res = await fetch('https://api.github.com/repos/supabase/supabase/contributors')
  const contributor_arr = await contributor_res.json()

  const contributor_data = contributor_arr.filter((object) => {
    return (
      object.login !== 'saltcod' &&
      object.login !== 'inian' &&
      object.login !== 'thorwebdev' &&
      object.login !== 'dependabot[bot]' &&
      object.login !== 'soedirgo' &&
      object.login !== 'dragarcia'
    )
  })

  if (!job_data && !contributor_data) {
    return {
      props: {
        notFound: true,
      },
    }
  }

  return {
    props: {
      job_data,
      contributor_data,
    },
  }
}

const CareerPage: NextPage = ({ job_data, contributor_data }: any) => {
  // base path for images
  const { basePath } = useRouter()

  const meta_title = 'Careers | Supabase'
  const meta_description = 'Help build software developers love'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/career`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/career/careers_og.png`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="text-scale-1200">
          <div className="container relative mx-auto px-6 py-10 lg:pt-12 lg:px-16 xl:px-20 text-center space-y-4">
            <span className="text-sm text-brand-900 md:text-base">Careers</span>
            <h1 className="text-3xl md:text-4xl xl:text-5xl">
              Help build software developers love
            </h1>
            <p className="text-sm md:text-base text-scale-1000 max-w-sm sm:max-w-md md:max-w-lg mx-auto">
              Explore remote opportunities and join our mission to help devs streamline the creation
              of modern apps
            </p>
            <Button>Open positions</Button>
          </div>

          <SectionContainer>
            <div className="space-y-10 md:space-y-0 ml-6 sm:ml-12 md:ml-0 md:flex md:items-start justify-around lg:max-w-5xl lg:mx-auto">
              {career.company.map((company: { number: string; text: string }, i: number) => {
                return (
                  <div
                    key={i}
                    className="border-t-[1px] md:border-0 md:pt-2 border-brand-900 max-w-[134px] md:max-w-none"
                  >
                    <div className="hidden md:block border-t-[1px] lg:border-t-2 border-brand-900 w-[60px] lg:w-[100px]"></div>
                    <h1 className="text-3xl lg:text-4xl pt-3">{company.number}</h1>
                    <ReactMarkdown className="text-scale-1100 text-sm lg:text-base">
                      {company.text}
                    </ReactMarkdown>
                  </div>
                )
              })}
            </div>
          </SectionContainer>

          <div className="border-y-2 border-scale-400 bg-scale-100 overflow-clip">
            <SectionContainer className="!py-0 !pb-16 lg:!pt-16">
              <div className="lg:flex lg:h-[500px]">
                <div className="relative aspect-square -top-[110px] -left-[200px] w-[575px] sm:-top-[150px] sm:-left-[300px] sm:w-[850px] lg:-top-[225px] lg:-left-[330px] lg:w-[800px] lg:h-[800px] xl:-left-[100px] xl:-top-[210px] xl:w-[1000px]">
                  <Globe />
                </div>
                <div className="relative -top-[75px] lg:top-0 lg:-left-[325px] xl:-left-[150px] 2xl:-left-[50px] lg:min-w-[400px] lg:h-fit xl:mt-10">
                  <h1 className="text-2xl sm:text-3xl xl:text-4xl max-w-[300px] lg:max-w-xs">
                    We work together, wherever we are
                  </h1>
                  <p className="text-scale-1100 mt-4 text-xs sm:text-sm lg:text-base md:w-5/6 lg:w-full">
                    We're 100% remote, globally distributed team. Working with a globally
                    distributed team can be challenging and rewarding. We have employees all over
                    the world, spanning 20 countries so we use tools like Notion, Slack, and Discord
                    to stay connected to our team, and our community.
                  </p>
                  <div className="max-w-[300px] sm:max-w-md lg:max-w-sm mt-20">
                    <div className="border-t-2 border-brand-900 w-4/12"></div>
                    <h1 className="text-2xl sm:text-3xl pt-2">
                      We deeply believe in the efficacy of collaborative open source
                    </h1>
                  </div>
                </div>
              </div>
            </SectionContainer>

            <SectionContainer>
              <div className="md:flex md:gap-6">
                <div className="md:w-1/2">
                  <div>
                    <h1 className="text-2xl sm:text-3xl xl:text-4xl">What is Supabase</h1>
                    <p className="text-scale-1100 text-xs sm:text-sm lg:text-base pt-2 sm:max-w-md xl:max-w-lg">
                      Supabase is an open source Firebase alternative, built by developers for
                      developers. Supabase adds auth, realtime, storage, restful APIs and edge
                      functions to Postgres without a single line of code. Supabase was born-remote.
                      Having a globally distributed, open source company is our secret weapon to
                      hiring top-tier talent.
                    </p>
                  </div>
                  <div className="md:w-full rounded-md mt-10 md:mt-36 lg:mt-40">
                    <img
                      className="rounded-md"
                      src={'/images/career/1.jpg'}
                      width="100%"
                      height="100%"
                    />
                  </div>
                  <div className="grid justify-items-end">
                    <div className="w-5/6 rounded-md mt-6">
                      <img
                        className="rounded-md"
                        src={'/images/career/2.jpg'}
                        width="100%"
                        height="100%"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 md:mt-0 md:w-1/2">
                  <div className="w-full rounded-md">
                    <img
                      className="rounded-md"
                      src={'/images/career/3.jpg'}
                      width="100%"
                      height="100%"
                    />
                  </div>
                  <div className="flex gap-6 mt-6">
                    <div className="w-full rounded-md">
                      <img
                        className="rounded-md"
                        src={'/images/career/4.jpg'}
                        width="100%"
                        height="100%"
                      />
                    </div>
                    <div className="w-full rounded-md">
                      <img
                        className="rounded-md"
                        src={'/images/career/5.jpg'}
                        width="100%"
                        height="100%"
                      />
                    </div>
                  </div>
                  <div className="w-5/6 rounded-md mt-6">
                    <img
                      className="rounded-md"
                      src={'/images/career/6.jpg'}
                      width="100%"
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            </SectionContainer>

            <SectionContainer>
              <h1 className="text-2xl sm:text-3xl xl:text-4xl">Human powered</h1>
              <p className="text-scale-1100 text-xs sm:text-sm lg:text-base pt-3 sm:w-3/5 lg:max-w-sm">
                As a completely remote and asynchronous team, we focus on these four traits to keep
                our team effective:
              </p>
              <div className="sm:flex items-start justify-between pt-10 space-y-6 sm:space-y-0">
                {career.humanPowered.map(
                  (human: { icon: string; title: string; text: string }, i: number) => {
                    return (
                      <div
                        key={i}
                        className="flex sm:block items-center space-x-6 sm:space-x-0 sm:space-y-4"
                      >
                        <div className="w-12 h-12 sm:w-10 sm:h-10 bg-brand-700 rounded-md flex justify-center">
                          <img className="rounded-md" src={human.icon} width="75%" height="75%" />
                        </div>
                        <div className="sm:max-w-[120px] md:max-w-[150px] xl:max-w-none">
                          <h2 className="text-sm md:text-md xl:text-xl md:pt-4 lg:pt-0">
                            {human.title}
                          </h2>
                          <p className="text-scale-1100 text-xs lg:text-base">{human.text}</p>
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </SectionContainer>

            <SectionContainer className="!pb-0">
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl xl:text-4xl max-w-[300px] xl:max-w-none mx-auto">
                  1,000 + Contributors building Supabase
                </h1>
                <p className="text-scale-1100 text-xs sm:text-sm lg:text-base sm:max-w-lg lg:max-w-xl mx-auto pt-3">
                  Just as versatile as our platform, we're building a community of communities,
                  bringing together developers from many different backgrounds, as well as new
                  developers looking to get involved with open source. We love celebrating everyone
                  who contributes their time to the Supabase mission.
                </p>
              </div>
              <div className="w-[1080px] h-[370px] mx-auto sm:mt-10 md:mt-16 lg:mt-28 2xl:mt-60">
                {contributor_data.slice(0, 19).map((contributor: any, i: number) => {
                  return (
                    <div
                      className={`${
                        Styles[`contributors-${i}`]
                      } absolute z-10 w-12 h-12 md:w-14 md:h-14 xl:w-16 xl:h-16 rounded-full border-[1.5px] border-scale-600`}
                      key={i}
                    >
                      <img
                        className="rounded-full"
                        src={contributor.avatar_url}
                        width="100%"
                        height="100%"
                      />
                    </div>
                  )
                })}
                <div
                  className={`${Styles['contributors-bg-circle']} w-[100%] lg:w-[80%] left-[0%] lg:left-[10%] -bottom-[30%] sm:-bottom-[52%] md:-bottom-[68%] lg:-bottom-[80%] xl:-bottom-[100%]`}
                >
                  <div className="flex flex-col justify-between h-full bg-scale-100 rounded-full p-4"></div>
                </div>
                <div
                  className={`${Styles['contributors-bg-circle']} w-[80%] lg:w-[60%] left-[10%] lg:left-[20%] -bottom-[25%] sm:-bottom-[44%] md:-bottom-[56%] lg:-bottom-[60%] xl:-bottom-[75%]`}
                >
                  <div className="flex flex-col justify-between h-full bg-scale-100 rounded-full p-4"></div>
                </div>
                <div
                  className={`${Styles['contributors-bg-circle']} w-[60%] lg:w-[40%] left-[20%] lg:left-[30%] -bottom-[20%] sm:-bottom-[38%] md:-bottom-[48%] lg:-bottom-[40%] xl:-bottom-[50%]`}
                >
                  <div className="flex flex-col justify-between h-full bg-scale-100 rounded-full p-4"></div>
                </div>
                <div
                  className={`${Styles['contributors-bg-circle']} w-[40%] lg:w-[20%] left-[30%] lg:left-[40%] -bottom-[15%] sm:-bottom-[30%] md:-bottom-[38%] lg:-bottom-[20%] xl:-bottom-[25%]`}
                >
                  <div className="flex flex-col justify-between h-full bg-scale-100 rounded-full p-4"></div>
                </div>
              </div>
            </SectionContainer>
          </div>

          <SectionContainer>
            <div className="xl:flex lg:items-start xl:gap-10 justify-between">
              <div className="xl:min-w-[300px] xl:max-w-[360px]">
                <h1 className="text-2xl sm:text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-none">
                  Great people deserve great benefits
                </h1>
                <p className="text-scale-1100 text-xs sm:max-w-md md:w-3/4 lg:w-3/5 xl:w-full sm:text-sm lg:text-base lg:max-w-xl pt-3">
                  We offer competitive and comprehensive benefits, though lots of companies can
                  offer you those. We also have a rarer opportunity: The impact you can make from
                  being at a nimble startup, working on a platform that operates at a significant
                  (and quickly growing) scale.
                </p>
              </div>
              <div className="mt-12 xl:mt-0 space-y-6 lg:space-y-0 sm:w-fit sm:mx-auto lg:grid lg:grid-cols-2 lg:gap-6">
                {career.benefits.map(
                  (benefits: { icon: string; title: string; text: string }, i: number) => {
                    return (
                      <div
                        className="h-full bg-scale-300 border-scale-400 border-[1px] p-8 rounded-lg flex max-w-md"
                        key={i}
                      >
                        <div>{benefits.icon}</div>
                        <div className="h-fit text-sm lg:text-base">
                          <h2 className="md:text-lg xl:text-base">{benefits.title}</h2>
                          <ReactMarkdown className="prose pt-1 xl:text-base">
                            {benefits.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <div className="max-w-md md:w-3/4 lg:w-1/2 xl:w-full xl:max-w-xl">
              <h1 className="text-2xl sm:text-3xl xl:text-4xl">Open positions</h1>
              <p className="text-xs sm:text-sm lg:text-base text-scale-1100 pt-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
            <div className="mt-10 space-y-6">
              {job_data.jobs.map(
                (
                  job: {
                    title: string
                    location: any
                    employment: string
                    description: string
                    absolute_url: string
                  },
                  i: number
                ) => {
                  return (
                    <div className="cursor-pointer md:cursor-default" key={i}>
                      <Link href={job.absolute_url}>
                        <div className="text-xs bg-scale-400 p-4 px-7 rounded-md sm:flex sm:items-center">
                          <h2 className="text-2xl min-w-[316px] mr-6">{job.title}</h2>
                          <div className="flex items-center justify-between justify-[normal] pt-2 sm:pt-0 sm:w-full">
                            <div className="flex items-center space-x-4">
                              <Badge className="rounded-md flex items-center lg:text-sm">
                                <img src="/images/career/icon/globe.svg" />
                                <span className="ml-1">{job.location.name}</span>
                              </Badge>
                              <span className="hidden md:block">{job.employment}</span>
                            </div>
                            <p className="hidden lg:block lg:text-sm">{job.description}</p>
                            <Button>Apply for position</Button>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                }
              )}
            </div>
          </SectionContainer>

          <SectionContainer>
            <div className="text-center sm:max-w-md md:w-3/4 lg:max-w-lg xl:max-w-2xl mx-auto">
              <h1 className="text-2xl sm:text-3xl xl:text-4xl">How we hire</h1>
              <p className="text-xs sm:text-sm lg:text-base text-scale-1100 pt-3">
                The entire process is fully remote and all communication happen over email or via
                video chat in Google. Meet. The calls are all 1:1 and usually take between 20-45
                minutes. We know you are interviewing us too, SO please ask questions. We are happy
                to answer.
              </p>
            </div>
            <div className="mt-16 md:ml-36 lg:flex lg:items-start lg:w-fit lg:mx-auto">
              {career.hiring.map((hiring: { title: string; text: string }, i: number) => {
                return (
                  <div
                    key={i + 1}
                    className="flex lg:block items-start space-x-6 lg:space-x-0 lg:w-full"
                  >
                    <div className="lg:flex items-center">
                      <h3 className="bg-brand-700 border-2 border-brand-900 text-brand-900 text-xl text-center w-[44px] px-3.5 py-1 rounded-md">
                        {i + 1}
                      </h3>
                      <div className="h-[100px] w-[1px] sm:h-[100px] mx-auto lg:h-[2px] lg:w-full bg-brand-900 lg:pr-6"></div>
                    </div>
                    <div className="lg:mt-6">
                      <h2 className="sm:text-lg max-w-[75%] xl:max-w-none xl:w-11/12 lg:max-w-none">
                        {hiring.title}
                      </h2>
                      <p className="text-scale-1100 text-xs sm:text-sm mt-1 md:w-3/4 lg:w-11/12">
                        {hiring.text}
                      </p>
                    </div>
                  </div>
                )
              })}
              <h3 className="bg-brand-700 border-2 border-brand-900 text-brand-900 text-xl w-[44px] min-h-[40px] px-2 py-1 rounded-md grid justify-items-center items-center">
                <IconCheck />
              </h3>
            </div>
          </SectionContainer>
        </div>
      </DefaultLayout>
    </>
  )
}

export default CareerPage

import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next'
import DefaultLayout from '~/components/Layouts/Default'
// import Image from 'next/image'
import Link from 'next/link'
import { Button, IconCheck } from '@supabase/ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ReactMarkdown from 'react-markdown'
import career from '../../data/career.json'
import Globe from '~/components/Globe'

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch('https://boards-api.greenhouse.io/v1/boards/supabase/jobs')
  const data = await res.json()

  if (!data) {
    return {
      props: {
        notFound: true,
      },
    }
  }

  return {
    props: {
      data,
    },
  }
}

const CareerPage: NextPage = ({ data }: InferGetServerSidePropsType<typeof GetServerSideProps>) => {
  return (
    <DefaultLayout>
      <div className="text-scale-1200">
        <div className="container relative mx-auto px-6 py-10 lg:px-16 xl:px-20 text-center space-y-4">
          <span className="text-sm text-brand-900">Careers</span>
          <h1 className="text-3xl md:text-4xl">Help build software developers love</h1>
          <p className="text-sm md:text-base text-scale-1000 sm:w-3/4 md:w-3/5 sm:mx-auto">
            Explore remote opportunities and join our mission to help devs streamline the creation
            of modern apps
          </p>
          <Button>Open positions</Button>
        </div>

        <SectionContainer>
          <div className="space-y-10 md:space-y-0 ml-4 md:ml-0 md:flex md:items-start justify-around">
            {career.company.map((company: { number: string; text: string }, i: number) => {
              return (
                <div
                  key={i}
                  className="border-t-[1px] md:border-0 md:pt-2 border-brand-900 max-w-[134px] md:max-w-none"
                >
                  <div className="hidden md:block border-t-[1px] border-brand-900 w-[60px] lg:w-[100px]"></div>
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
              <div className="relative aspect-square -top-[110px] -left-[200px] w-[575px] sm:-top-[150px] sm:-left-[300px] sm:w-[850px] lg:-top-[225px] lg:-left-[330px] lg:w-[800px] lg:h-[800px] xl:-left-[300px] xl:-top-[210px] xl:w-[1000px]">
                <Globe />
              </div>
              <div className="relative -top-[75px] lg:top-0 lg:-left-[325px] xl:-left-[150px] 2xl:-left-[50px] lg:min-w-[400px] lg:h-fit xl:mt-10">
                <h1 className="text-2xl sm:text-3xl lg:w-3/4">We work together, wherever we are</h1>
                <p className="text-scale-1100 mt-4 text-xs sm:text-sm md:w-5/6 lg:w-full">
                  We're 100% remote, globally distributed team. Working with a globally distributed
                  team can be challenging and rewarding. We have employees all over the world,
                  spanning 20 countries so we use tools like Notion, Slack, and Discord to stay
                  connected to our team, and our community.
                </p>
                <div>
                  <div className="border-t-2 border-brand-900 w-2/5 sm:w-1/5 mt-20"></div>
                  <h1 className="text-2xl sm:text-3xl pt-2 sm:w-3/5 md:w-4/5 lg:w-full">
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
                  <h1 className="text-2xl sm:text-3xl">What is Supabase</h1>
                  <p className="text-scale-1100 text-xs sm:text-sm pt-2">
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
                  <div className="w-5/6 md:w-full rounded-md mt-6">
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
                <div className="w-5/6 md:w-full rounded-md mt-6">
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
            <h1 className="text-2xl sm:text-3xl">Human powered</h1>
            <p className="text-scale-1100 text-xs sm:text-sm pt-3 sm:w-3/5">
              As a completely remote and asynchronous team, we focus on these four traits to keep
              our team effective:
            </p>
            <div className="sm:flex items-start justify-between pt-10 space-y-6 sm:space-y-0">
              {career.humanPowered.map(
                (human: { icon: string; title: string; text: string }, i: number) => {
                  return (
                    <div
                      key={i}
                      className="flex sm:block items-center space-x-6 sm:space-x-0 sm:space-y-4 min-w-[150px]"
                    >
                      <div className="w-12 h-12 sm:w-10 sm:h-10 bg-brand-700 rounded-md flex justify-center">
                        <img className="rounded-md" src={human.icon} width="75%" height="75%" />
                      </div>
                      <div>
                        <h2 className="text-md sm:text-sm lg:text-md md:pt-4 lg:pt-0">
                          {human.title}
                        </h2>
                        <ReactMarkdown className="text-scale-1100 text-xs">
                          {human.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </SectionContainer>
        </div>

        <SectionContainer>
          <div className="xl:flex lg:items-start xl:gap-10 justify-between">
            <div className="xl:min-w-[300px] xl:max-w-[360px]">
              <h1 className="text-2xl sm:text-3xl md:w-1/2 lg:w-2/5 xl:w-full">
                Great people deserve great benefits
              </h1>
              <p className="text-scale-1100 text-xs md:w-3/4 lg:w-3/5 xl:w-full sm:text-sm pt-3">
                We offer competitive and comprehensive benefits, though lots of companies can offer
                you those. We also have a rarer opportunity: The impact you can make from being at a
                nimble startup, working on a platform that operates at a significant (and quickly
                growing) scale.
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
                      <div className="h-fit">
                        <h2 className="sm:text-lg">{benefits.title}</h2>
                        <ReactMarkdown className="prose text-xs sm:text-sm">
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
          <div className="md:w-3/4 lg:w-1/2">
            <h1 className="text-2xl sm:text-3xl">Open positions</h1>
            <p className="text-xs sm:text-sm text-scale-1100 pt-2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          <div className="mt-10 space-y-6">
            {data.jobs.map(
              (
                job: {
                  title: string
                  employment: string
                  description: string
                  absolute_url: string
                },
                i: number
              ) => {
                return (
                  <div className="cursor-pointer md:cursor-default" key={i}>
                    <Link href={job.absolute_url}>
                      <div className="text-xs bg-scale-400 p-4 rounded-md sm:flex sm:items-center">
                        <h2 className="text-2xl min-w-max mr-4">{job.title}</h2>
                        <div className="flex items-center justify-between justify-[normal] pt-2 sm:pt-0 sm:w-full">
                          <div className="flex items-center space-x-4">
                            <div className="bg-brand-700 text-brand-900 border-brand-900 border-[1px] px-2.5 py-1 rounded-md flex items-center">
                              <img src="/images/career/icon/globe.svg" />
                              <span className="ml-1">{job.location.name}</span>
                            </div>
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
          <div className="text-center md:w-3/4 mx-auto">
            <h1 className="text-2xl sm:text-3xl">How we hire</h1>
            <p className="text-xs sm:text-sm text-scale-1100 pt-3">
              The entire process is fully remote and all communication happen over email or via
              video chat in Google. Meet. The calls are all 1:1 and usually take between 20-45
              minutes. We know you are interviewing us too, SO please ask questions. We are happy to
              answer.
            </p>
          </div>
          <div className="mt-16 md:ml-36 lg:flex lg:items-start lg:w-fit lg:mx-auto">
            {career.hiring.map((hiring: { title: string; text: string }, i: number) => {
              return (
                <div
                  key={i + 1}
                  className="flex lg:block items-start space-x-6 lg:space-x-0 lg:max-w-[220px]"
                >
                  <div className="lg:flex items-center">
                    <h3 className="bg-brand-700 border-2 border-brand-900 text-brand-900 text-xl text-center w-[44px] px-3.5 py-1 rounded-md">
                      {i + 1}
                    </h3>
                    <div className="h-[150px] w-[1px] sm:h-[100px] mx-auto lg:h-[1px] lg:w-full bg-brand-900 lg:pr-6"></div>
                  </div>
                  <div className="lg:mt-6">
                    <h2 className="text-lg sm:text-xl">{hiring.title}</h2>
                    <p className="text-scale-1100 text-xs sm:text-sm mt-1 md:w-3/4">
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
  )
}

export default CareerPage

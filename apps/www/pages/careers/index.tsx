import { NextPage } from 'next'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ReactMarkdown from 'react-markdown'
import { Badge, Button, IconCheck } from 'ui'
import Globe from '~/components/Globe'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { useTheme } from 'next-themes'
import career from '~/data/career.json'
import Styles from './career.module.css'

export async function getStaticProps() {
  const job_res = await fetch('https://boards-api.greenhouse.io/v1/boards/supabase/jobs')

  const job_data = await job_res.json()

  const contributor_res = await fetch(
    'https://api.github.com/repos/supabase/supabase/contributors?per_page=100'
  )
  const contributor_arr = await contributor_res.json()

  const contributor_data = await contributor_arr.map(
    (contributor: { login: string; avatar_url: string; html_url: string }) => {
      return {
        login: contributor.login,
        avatar_url: contributor.avatar_url,
        html_url: contributor.html_url,
      }
    }
  )

  const contributors = await contributor_data.filter((contributor: any) =>
    career.contributors.includes(contributor.login)
  )

  contributors.push(
    {
      login: 'XquisiteDreamer',
      avatar_url: 'https://pbs.twimg.com/profile_images/1475874191249399808/H6TPHpq7_400x400.png',
      html_url: 'https://twitter.com/XquisiteDreamer',
    },
    {
      login: 'marijanasimag',
      avatar_url: 'https://avatars.githubusercontent.com/u/46031252?v=4',
      html_url: 'https://github.com/marijanasimag',
    },
    {
      login: 'lyqht',
      avatar_url: 'https://pbs.twimg.com/profile_images/1665778877837504514/4SWgLpjA_400x400.png',
      html_url: 'https://twitter.com/estee_tey',
    },
    {
      login: 'ghostdevv',
      avatar_url: 'https://avatars.githubusercontent.com/u/47755378?v=4',
      html_url: 'https://github.com/ghostdevv',
    }
  )

  if (!job_data && !contributors) {
    return {
      props: {
        notFound: true,
      },
    }
  }

  return {
    props: {
      jobs: job_data.jobs,
      contributors: contributors,
    },
  }
}

const CareerPage: NextPage = ({ jobs, contributors }: any) => {
  const { resolvedTheme } = useTheme()
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
          url: `https://supabase.com/careers`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/career/careers_og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="text-foreground">
          <div className="container relative mx-auto px-6 py-10 lg:pt-12 lg:px-16 xl:px-20 text-center space-y-4">
            <h1 className="text-sm text-brand md:text-base">
              <span className="sr-only">Supabase </span>Careers
            </h1>
            <h2 className="text-3xl md:text-4xl xl:text-5xl lg:max-w-2xl xl:max-w-3xl lg:mx-auto tracking-[-1.5px]">
              We're on a mission to build the best developer platform
            </h2>
            <p className="text-sm md:text-base text-foreground-lighter max-w-sm sm:max-w-md md:max-w-lg mx-auto">
              Explore remote possibilities and join our team to help us achieve it.
            </p>
            <a href="#positions">
              <Button className="text-white xl:text-sm mt-4">Open positions</Button>
            </a>
          </div>

          <SectionContainer>
            <div className="flex flex-wrap md:flex-nowrap -mt-6 md:mt-0 w-fit md:w-full mx-auto md:flex md:items-start justify-around lg:w-full lg:max-w-5xl">
              {career.company.map((company: { number: string; text: string }, i: number) => {
                return (
                  <div
                    key={i}
                    className="border-t-[1px] mt-6 mx-2 md:mx-2 md:mt-0 md:border-0 border-brand w-[134px] md:max-w-none"
                  >
                    <div className="hidden md:block border-t-[1px] lg:border-t-2 border-brand w-[60px] lg:w-[100px]"></div>
                    <h2 className="text-3xl lg:text-4xl pt-3 tracking-[-1.5px]">
                      {company.number}
                    </h2>
                    <ReactMarkdown className="text-foreground-light text-sm lg:text-base">
                      {company.text}
                    </ReactMarkdown>
                  </div>
                )
              })}
            </div>
          </SectionContainer>

          <div className="py-[1.25px] bg-gradient-to-r from-background via-border to-background">
            <div className="bg-alternative overflow-clip">
              <SectionContainer className="!py-0 !pb-16 lg:!pt-16">
                <div className="lg:flex lg:h-[500px]">
                  <div className="relative aspect-square -top-[110px] -left-[200px] w-[575px] sm:-top-[150px] sm:-left-[300px] sm:w-[850px] lg:-top-[225px] lg:-left-[330px] lg:w-[800px] lg:h-[800px] xl:-left-[200px] xl:-top-[210px] xl:w-[1000px]">
                    <Globe />
                  </div>
                  <div className="relative -top-[75px] lg:top-0 lg:-left-[325px] xl:-top-[45px] xl:-left-[150px] 2xl:-left-[50px] lg:min-w-[400px] lg:h-fit xl:mt-10">
                    <h2 className="text-2xl sm:text-3xl xl:text-4xl max-w-[300px] lg:max-w-xs tracking-[-1.5px]">
                      We work together, wherever we are
                    </h2>
                    <p className="text-foreground-light mt-4 text-xs sm:text-sm lg:text-base md:w-5/6 lg:w-full">
                      Working in a globally distributed team is rewarding but has its challenges. We
                      are across many different timezones, so we use tools like Notion, Slack, and
                      Discord to stay connected to our team, and our community.
                    </p>
                    <div className="max-w-[300px] sm:max-w-md lg:max-w-md mt-20">
                      <div className="border-t-2 border-brand w-4/12"></div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl pt-2 tracking-[-1.5px]">
                        We deeply believe in the efficacy of collaborative open source
                      </h2>
                    </div>
                  </div>
                </div>
              </SectionContainer>

              <SectionContainer className="-mt-16 md:mt-0">
                <div className="md:flex md:gap-6">
                  <div className="md:w-1/2">
                    <div>
                      <h2 className="text-2xl sm:text-3xl xl:text-4xl tracking-[-1.5px]">
                        What is Supabase
                      </h2>
                      <p className="text-foreground-light text-xs sm:text-sm lg:text-base pt-2 sm:max-w-md xl:max-w-lg">
                        Supabase is an open source Firebase alternative, built by developers for
                        developers. Supabase adds auth, realtime, storage, restful APIs, and edge
                        functions to Postgres without a single line of code. Supabase was
                        born-remote. Having a globally distributed, open source company is our
                        secret weapon to hiring top-tier talent.
                      </p>
                    </div>
                    <div className="md:w-full rounded-md mt-10 md:mt-36 lg:mt-40">
                      <div className="relative w-full aspect-[148/125]">
                        <Image
                          src="/images/career/1.jpg"
                          alt="team photo"
                          layout="fill"
                          objectFit="cover"
                          placeholder="blur"
                          blurDataURL="/images/blur.png"
                          className="rounded-md"
                        />
                      </div>
                    </div>
                    <div className="grid justify-items-end">
                      <div className="w-full md:w-5/6 rounded-md mt-6">
                        <div className="relative w-full aspect-[29/22]">
                          <Image
                            src="/images/career/2.jpg"
                            alt="team photo"
                            layout="fill"
                            objectFit="cover"
                            placeholder="blur"
                            blurDataURL="/images/blur.png"
                            className="rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 md:mt-0 w-full md:w-1/2">
                    <div className="w-full rounded-md">
                      <div className="relative w-full aspect-[137/110]">
                        <Image
                          src="/images/career/3.jpg"
                          alt="team photo"
                          layout="fill"
                          objectFit="cover"
                          placeholder="blur"
                          blurDataURL="/images/blur.png"
                          className="rounded-md"
                        />
                      </div>
                    </div>
                    <div className="flex gap-6 mt-6">
                      <div className="w-full rounded-md">
                        <div className="relative w-full aspect-[142/189]">
                          <Image
                            src="/images/career/4.jpg"
                            alt="team photo"
                            layout="fill"
                            objectFit="cover"
                            placeholder="blur"
                            blurDataURL="/images/blur.png"
                            className="rounded-md"
                          />
                        </div>
                      </div>
                      <div className="w-full rounded-md">
                        <div className="relative w-full aspect-[142/189]">
                          <Image
                            src="/images/career/5.jpg"
                            alt="team photo"
                            layout="fill"
                            objectFit="cover"
                            placeholder="blur"
                            blurDataURL="/images/blur.png"
                            className="rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-full rounded-md mt-6">
                      <div className="relative w-full aspect-[16/9]">
                        <Image
                          src="/images/career/6.jpg"
                          alt="team photo"
                          layout="fill"
                          objectFit="cover"
                          placeholder="blur"
                          blurDataURL="/images/blur.png"
                          className="rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionContainer>

              <SectionContainer>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl tracking-[-1.5px]">
                  Human powered
                </h2>
                <p className="text-foreground-lighter text-xs sm:text-sm lg:text-base pt-3 sm:w-3/5 lg:max-w-sm">
                  As a completely remote and asynchronous team, we focus on these five traits to
                  keep our team effective:
                </p>
                <div className="grid pt-10 gap-8 grid-cols-2 md:grid-cols-3 lg:gap-12 lg:grid-cols-5">
                  {career.humanPowered.map(
                    (human: { icon: string; title: string; text: string }, i: number) => {
                      return (
                        <div key={i} className="flex flex-col gap-3">
                          <div className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center">
                            <div className="relative w-full h-full mx-auto">
                              <Image
                                src={`/images/career/icons/${human.icon}${
                                  resolvedTheme?.includes('dark') ? '-dark' : '-light'
                                }.svg`}
                                className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                                alt={`${human.icon} icon`}
                                layout="fill"
                                objectFit="fill"
                              />
                            </div>
                          </div>
                          <div>
                            <h2 className="text-base">{human.title}</h2>
                            <p className="text-foreground-light text-xs lg:text-sm">{human.text}</p>
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </SectionContainer>

              <SectionContainer className="!pb-0">
                <div className="w-14 h-14 rounded-lg flex items-center mx-auto mb-6">
                  <div className="relative w-full h-full mx-auto">
                    <Image
                      src={`/images/career/icons/open_source${
                        resolvedTheme?.includes('dark') ? '-dark' : '-light'
                      }.svg`}
                      alt="open source icon"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl xl:text-4xl max-w-[300px] xl:max-w-none mx-auto tracking-[-1.5px]">
                    1,000 + Contributors building Supabase
                  </h2>
                  <p className="text-foreground-light text-xs sm:text-sm lg:text-base sm:max-w-lg lg:max-w-2xl mx-auto pt-3">
                    We're building a community of communities, bringing together developers from
                    many different backgrounds, as well as new developers looking to get involved
                    with open source. We love celebrating everyone who contributes their time to the
                    Supabase mission.
                  </p>
                </div>
                <div className="w-[1080px] h-[370px] mx-auto sm:mt-10 md:mt-16 lg:mt-28 2xl:mt-60">
                  {contributors.map((contributor: any, i: number) => {
                    return (
                      <div
                        className={`${
                          Styles[`contributors-${i}`]
                        } absolute w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border-[1.5px] border-default z-10
                          transition-all hover:scale-105 drop-shadow-sm hover:drop-shadow-md
                        `}
                        key={i}
                      >
                        <Link href={contributor.html_url} target="_blank">
                          <div className="relative w-full h-full">
                            <Image
                              src={contributor.avatar_url}
                              alt={`${contributor.login} github avatar`}
                              className="rounded-full"
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                  <div
                    className={`${Styles['contributors-bg-circle']} w-[100%] lg:w-[80%] left-[0%] lg:left-[10%] -bottom-[30%] xs:-bottom-[36%] sm:-bottom-[52%] md:-bottom-[64%] lg:-bottom-[80%] xl:-bottom-[100%]`}
                  >
                    <div className="flex flex-col justify-between h-full bg-alternative rounded-full p-4"></div>
                  </div>
                  <div
                    className={`${Styles['contributors-bg-circle']} w-[80%] lg:w-[60%] left-[10%] lg:left-[20%] -bottom-[25%] xs:-bottom-[30%] sm:-bottom-[44%] md:-bottom-[54%] lg:-bottom-[60%] xl:-bottom-[75%]`}
                  >
                    <div className="flex flex-col justify-between h-full bg-alternative rounded-full p-4"></div>
                  </div>
                  <div
                    className={`${Styles['contributors-bg-circle']} w-[60%] lg:w-[40%] left-[20%] lg:left-[30%] -bottom-[20%] xs:-bottom-[25%] sm:-bottom-[38%] md:-bottom-[44%] lg:-bottom-[40%] xl:-bottom-[50%]`}
                  >
                    <div className="flex flex-col justify-between h-full bg-alternative rounded-full p-4"></div>
                  </div>
                  <div
                    className={`${Styles['contributors-bg-circle']} w-[40%] lg:w-[20%] left-[30%] lg:left-[40%] -bottom-[15%] xs:-bottom-[19%] sm:-bottom-[30%] md:-bottom-[34%] lg:-bottom-[20%] xl:-bottom-[25%]`}
                  >
                    <div className="flex flex-col justify-between h-full bg-alternative rounded-full p-4"></div>
                  </div>
                </div>
              </SectionContainer>
            </div>
          </div>

          <SectionContainer>
            <div className="xl:flex lg:items-start xl:gap-10 justify-between">
              <div className="xl:min-w-[300px] xl:max-w-[360px]">
                <h2 className="text-2xl sm:text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-none tracking-[-1.5px]">
                  Great people deserve great benefits
                </h2>
              </div>
              <div className="mt-12 xl:mt-0 space-y-6 lg:space-y-0 sm:w-fit sm:mx-auto lg:grid lg:grid-cols-2 lg:gap-6">
                {career.benefits.map(
                  (benefits: { icon: string; title: string; text: string }, i: number) => {
                    return (
                      <div
                        className="h-full bg-alternative drop-shadow-sm border-muted border-[1px] p-6 rounded-lg flex items-start space-x-6 w-full"
                        key={i}
                      >
                        <div className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 aspect-square rounded-lg flex items-center">
                          <div className="relative w-full h-full mx-auto">
                            <Image
                              src={`/images/career/icons/${benefits.icon}${
                                resolvedTheme?.includes('dark') ? '-dark' : '-light'
                              }.svg`}
                              alt={`${benefits.icon} icon`}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        </div>
                        <div className="h-fit text-sm lg:text-base">
                          <h2 className="text-base">{benefits.title}</h2>
                          <ReactMarkdown className="prose pt-1 text-sm">
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
            <div className="w-14 h-14 rounded-lg flex items-center mx-auto mb-6">
              <div className="relative w-full h-full mx-auto">
                <Image
                  src={`/images/career/icons/jobs${
                    resolvedTheme?.includes('dark') ? '-dark' : '-light'
                  }.svg`}
                  alt="jobs icon"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </div>
            <div className="text-center sm:max-w-md md:w-3/4 lg:max-w-lg xl:max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl xl:text-4xl tracking-[-1.5px]">How we hire</h2>
              <p className="text-xs sm:text-sm lg:text-base text-foreground-light pt-3">
                The entire process is fully remote and all communication happens over email or via
                video chat in Google Meet. The calls are all 1:1 and usually take between 20-45
                minutes. We know you are interviewing us too, so please ask questions. We are happy
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
                      <h3 className="bg-brand-400 border-[1px] border-brand-300 text-brand-600 text-md text-center w-[44px] px-2 py-1.5 rounded-md">
                        {i + 1}
                      </h3>
                      <div className="h-[100px] w-[1px] sm:h-[100px] mx-auto lg:h-[1px] lg:w-full bg-brand-500 lg:pr-6"></div>
                    </div>
                    <div className="lg:mt-6">
                      <h2 className="sm:text-lg max-w-[75%] xl:max-w-none xl:w-11/12 lg:max-w-none">
                        {hiring.title}
                      </h2>
                      <p className="text-foreground-light text-xs sm:text-sm mt-1 md:w-3/4 lg:w-11/12">
                        {hiring.text}
                      </p>
                    </div>
                  </div>
                )
              })}
              <h3 className="bg-brand-400 border-[1px] border-brand-300 text-brand-600 text-xl w-[44px] lg:min-w-[40px] min-h-[40px] px-2 py-1 rounded-md grid justify-items-center items-center">
                <IconCheck />
              </h3>
            </div>
          </SectionContainer>

          <div id="positions" className="positions">
            <SectionContainer>
              <h2 className="text-2xl sm:text-3xl xl:text-4xl tracking-[-1.5px]">Open positions</h2>
              <div className="mt-10 space-y-4">
                {jobs.map(
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
                          <div className="bg-alternative border-muted drop-shadow-sm border p-4 px-7 rounded-md sm:flex sm:items-center transition ease-out hover:bg-surface-100 hover:drop-shadow-md hover:cursor-pointer">
                            <h2 className="text-base min-w-[240px] lg:min-w-[316px] truncate mr-6">
                              {job.title}
                            </h2>
                            <div className="flex items-center justify-between justify-[normal] pt-2 sm:pt-0 sm:w-full">
                              <div className="flex items-center space-x-4">
                                <Badge className="rounded-full flex items-center lg:text-sm">
                                  <div className="w-3 h-3">
                                    <img
                                      src="/images/career/icons/globe-dark.svg"
                                      alt="globe icon"
                                      width="100%"
                                      height="100%"
                                    />
                                  </div>
                                  <span className="ml-1">{job.location.name}</span>
                                </Badge>
                                <span className="hidden md:block">{job.employment}</span>
                              </div>
                              <p className="hidden lg:block lg:text-sm">{job.description}</p>
                              <Button className="text-white">Apply for position</Button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  }
                )}
              </div>
            </SectionContainer>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

export default CareerPage

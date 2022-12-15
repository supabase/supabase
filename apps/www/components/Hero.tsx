import { Button, IconBookOpen, Space } from 'ui'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SectionContainer from './Layouts/SectionContainer'

const Hero = () => {
  const { basePath } = useRouter()

  return (
    <div className="overflow-hidden">
      <SectionContainer className="pb-0 pt-24">
        <div className="relative">
          <main className="">
            <div className="mx-auto">
              <div className="lg:grid lg:grid-cols-12 lg:gap-16">
                <div className="md:mx-auto md:max-w-2xl lg:col-span-6 lg:flex lg:items-center lg:text-left">
                  <div
                    className="
                    space-y-12 sm:mx-auto md:w-3/4 lg:mx-0
                    lg:w-full"
                  >
                    <div>
                      <h1
                        className="
                        text-scale-1200
                        text-2xl sm:text-3xl sm:leading-none lg:text-4xl
                        xl:text-5xl
                        "
                      >
                        <span className="block">Build in a weekend.</span>
                        <span className="text-brand-900 block md:ml-0">Scale to millions.</span>
                      </h1>
                      <div>
                        <p className="p mt-1.5 text-sm sm:mt-5 sm:text-base lg:text-lg ">
                          Supabase is an open source Firebase alternative. Start your project with a
                          Postgres database, Authentication, instant APIs, Edge Functions, Realtime
                          subscriptions, and Storage.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href="https://app.supabase.com" as="https://app.supabase.com" passHref>
                        <Button as="a" size="small" className="text-white">
                          Start your project
                        </Button>
                      </Link>
                      <Link href="/docs" as="/docs" passHref>
                        <Button as="a" size="small" type="default" icon={<IconBookOpen />}>
                          Documentation
                        </Button>
                      </Link>
                    </div>
                    <div className="flex flex-col gap-4">
                      <small className="small text-xs">backed by</small>
                      <div className="w-full sm:max-w-lg lg:ml-0">
                        <div className="flex flex-wrap items-center justify-start gap-y-8 sm:flex-nowrap">
                          <img
                            className="h-8 pr-5 sm:h-8 md:pr-10"
                            src={`${basePath}/images/logos/yc--grey.png`}
                            alt="Y Combinator"
                          />
                          <img
                            className="relative h-5 pr-5 sm:h-5 md:pr-10"
                            src={`${basePath}/images/logos/mozilla--grey.png`}
                            alt="Mozilla"
                          />
                          <img
                            className="relative h-5 pr-5 sm:h-5 md:pr-10"
                            src={`${basePath}/images/logos/coatue.png`}
                            alt="Coatue"
                          />
                          <img
                            className="relative h-6 pr-5 sm:h-6 md:pr-10"
                            src={`${basePath}/images/logos/felicis.png`}
                            alt="Felicis"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-16 flex content-center sm:mt-24 lg:absolute lg:-right-80 lg:col-span-6 lg:mt-0 lg:w-9/12 xl:relative xl:right-0 xl:w-full">
                  <div className="relative flex w-full flex-col items-center justify-center rounded-md">
                    <div className="bg-scale-400 flex h-5 w-full items-center justify-start rounded-t-md px-2">
                      <div className="bg-scale-800 mr-2 h-2 w-2 rounded-full" />
                      <div className="bg-scale-800 mr-2 h-2 w-2 rounded-full" />
                      <div className="bg-scale-800 mr-2 h-2 w-2 rounded-full" />
                    </div>
                    <div
                      className="bg-scale-1000 relative w-full rounded-b-md shadow-lg"
                      style={{ padding: '56.25% 0 0 0' }}
                    >
                      <iframe
                        title="Demo video showcasing Supabase"
                        className="absolute h-full w-full rounded-b-md"
                        src="https://www.youtube-nocookie.com/embed/dBOSUER_5T4?playlist=dBOSUER_5T4&autoplay=1&loop=1&controls=0&modestbranding=1&rel=0&disablekb=1&mute=1&muted=1"
                        style={{ top: 0, left: 0 }}
                        frameBorder="0"
                        allow="autoplay; modestbranding; encrypted-media"
                      />
                    </div>
                    {/*
                      Replace src with the following if have preference:
                      Vimeo:   https://player.vimeo.com/video/485959063?loop=1&autoplay=1
                      Youtube: https://www.youtube-nocookie.com/embed/dBOSUER_5T4?playlist=dBOSUER_5T4&autoplay=1&loop=1&controls=0&modestbranding=1&rel=0&disablekb=1&mute=1&muted=1
                     */}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SectionContainer>
    </div>
  )
}

export default Hero

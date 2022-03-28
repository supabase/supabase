import { Button, IconBookOpen, Space } from '@supabase/ui'
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
                <div className="md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center">
                  <div
                    className="
                    sm:mx-auto md:w-3/4 lg:w-full lg:mx-0 
                    space-y-12"
                  >
                    <div>
                      <h1
                        className="
                        sm:leading-none 
                        text-xl lg:text-4xl xl:text-5xl
                        text-scale-1200
                        "
                      >
                        <span className="block">The Open Source</span>
                        <span className="text-brand-900 md:ml-0 block">Firebase Alternative</span>
                      </h1>
                      <div>
                        <p className="p text-base sm:mt-5 lg:text-lg ">
                          Create a backend in less than 2 minutes. Start your project with a
                          Postgres Database, Authentication, instant APIs, Realtime subscriptions
                          and Storage.
                        </p>
                        <p className="p text-base">Serverless functions coming soon</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Link href="https://app.supabase.io" as="https://app.supabase.io" passHref>
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
                        <div className="flex flex-wrap items-center justify-start">
                          <img
                            className="h-8 sm:h-10 pr-5 md:pr-10 mb-5"
                            src={`${basePath}/images/logos/yc--grey.png`}
                            alt="Y Combinator"
                          />
                          <img
                            className="relative h-5 sm:h-7 pr-5 md:pr-10 mb-5"
                            src={`${basePath}/images/logos/mozilla--grey.png`}
                            alt="Mozilla"
                          />
                          <img
                            className="relative h-5 sm:h-7 pr-5 md:pr-10 mb-5"
                            src={`${basePath}/images/logos/coatue.png`}
                            alt="Coatue"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex content-center mt-16 sm:mt-24 lg:absolute lg:-right-80 lg:w-9/12 lg:mt-0 lg:col-span-6 xl:relative xl:right-0 xl:w-full">
                  <div className="flex flex-col items-center justify-center relative w-full rounded-md">
                    <div className="w-full rounded-t-md h-5 bg-scale-400 flex items-center justify-start px-2">
                      <div className="h-2 w-2 mr-2 rounded-full bg-scale-800" />
                      <div className="h-2 w-2 mr-2 rounded-full bg-scale-800" />
                      <div className="h-2 w-2 mr-2 rounded-full bg-scale-800" />
                    </div>
                    <div
                      className="w-full relative bg-scale-1000 shadow-lg rounded-b-md"
                      style={{ padding: '56.25% 0 0 0' }}
                    >
                      <iframe
                        title="Demo video showcasing Supabase"
                        className="absolute w-full h-full rounded-b-md"
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

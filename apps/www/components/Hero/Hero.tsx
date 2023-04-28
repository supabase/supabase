import { Button, IconBookOpen } from 'ui'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SectionContainer from '../Layouts/SectionContainer'
import styles from './hero.module.css'

const Hero = () => {
  const { basePath } = useRouter()

  return (
    <div className="relative">
      <SectionContainer className="">
        <div className="relative">
          <div className="mx-auto">
            <div className="mx-auto max-w-2xl lg:col-span-6 lg:flex lg:items-center justify-center text-center">
              <div className="lg:h-[40vh] lg:min-h-[300px] lg:max-h-[400px] md:py-4 flex flex-col items-center justify-center sm:mx-auto md:w-3/4 lg:mx-0 lg:w-full gap-4 lg:gap-8">
                <div>
                  <h1
                    className="
                        text-scale-1200
                        text-4xl sm:text-5xl sm:leading-none lg:text-6xl
                        xl:text-7xl
                        "
                  >
                    <span className="block">Build in a weekend.</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3ECF8E] via-[#3ECF8E] to-[#3E9BCF] block md:ml-0">
                      Scale to millions.
                    </span>
                  </h1>
                  <p className="py-2 text-scale-1200 !mb-0 mt-1.5 text-sm sm:mt-5 sm:text-base lg:text-lg">
                    Supabase is an open source Firebase alternative for building secure and
                    performant Postgres backends with minimal configuration.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="https://app.supabase.com" as="https://app.supabase.com" passHref>
                    <a>
                      <Button size="small" className="text-white">
                        Start your project
                      </Button>
                    </a>
                  </Link>
                  <Link href="/docs" as="/docs" passHref>
                    <a>
                      <Button size="small" type="default" icon={<IconBookOpen />}>
                        Documentation
                      </Button>
                    </a>
                  </Link>
                </div>
                {/* <div className="flex flex-col gap-4">
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
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
      <div
        className={[
          'absolute z-[-4] flex flex-col top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none',
        ].join(' ')}
      >
        <div className="absolute w-screen h-screen">
          <div className="w-full h-[200px] md:h-[250px] lg:h-[150px] xl:h-[50px] 2xl:h-0 bg-[#171717]" />
          <div className={['2xl:-mt-48'].join(' ')}>
            <svg
              className={['', styles['triangle-svg']].join(' ')}
              preserveAspectRatio="none"
              width="100%"
              height="100%"
              viewBox="0 0 1680 915"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.16005e-05 -0.000998163L1680 0.129286V234L834.197 1068.2L-0.000248139 234.001L2.16005e-05 -0.000998163Z"
                fill="#171717"
              />
            </svg>
          </div>
        </div>
      </div>
      <div
        className={[
          'absolute top-0 left-0 w-full h-[600px] md:h-[800px] overflow-hidden pointer-events-none',
          styles['hero-container'],
        ].join(' ')}
      >
        <div className={['w-full h-full', styles['gradient']].join(' ')} />
        <div className="absolute bottom-0 z-[-2] w-full h-full bg-gradient-to-t from-scale-100 to-transparent" />
        <div
          className={[
            'relative -z-10 ![perspective:1200px] sm:![perspective:1200px] md:![perspective:1200px] lg:![perspective:1200px]',
          ].join(' ')}
        >
          <div
            className="z-[100] absolute inset-0 [--gradient-stop-1:0px] [--gradient-stop-2:50%]"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0) 0px, #000000 50%)',
            }}
          ></div>
          <div
            style={{
              transform: 'rotateX(85deg)',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          >
            <div className={[styles['hero-grid-lines']].join(' ')}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero

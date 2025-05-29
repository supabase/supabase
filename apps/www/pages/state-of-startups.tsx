import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import DefaultLayout from '~/components/Layouts/Default'

import { useBreakpoint } from 'common'
import data from '~/data/surveys/state-of-startups-2025'
import { Button, Checkbox, cn } from 'ui'
import Link from 'next/link'
import SectionContainer from '../components/Layouts/SectionContainer'
import { Input } from 'ui/src/components/shadcn/ui/input'
import { Label } from 'ui/src/components/shadcn/ui/label'

const EnterpriseCta = dynamic(() => import('~/components/Sections/EnterpriseCta'))

function VectorPage() {
  // base path for images
  const isXs = useBreakpoint(640)
  const pageData = data(isXs)
  const meta_title = pageData.metaTitle
  const meta_description = pageData.metaDescription
  const meta_image = pageData.metaImage

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/modules/vector`,
          images: [
            {
              url: meta_image,
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-alternative">
        <Hero {...pageData.heroSection} />
        <SectionContainer>
          <div className="flex flex-col text-center gap-4 py-8 items-center justify-center">
            <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">Stay in touch</h2>
            <p className="mx-auto text-foreground-lighter w-full">
              Sign up for our newsletter to be notified when the survey results are available.
            </p>
            <div className="w-full mt-4 flex items-center justify-center text-center gap-4">
              <form action="" className="w-full max-w-md flex flex-col gap-4 items-center">
                <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2">
                  <Input type="email" placeholder="Email" />
                  <Button size="small" onClick={() => null}>
                    Register
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">
                    I agree to the <Link href="/terms">Terms of Service</Link> and{' '}
                    <Link href="/privacy">Privacy Policy</Link>
                  </Label>
                </div>
              </form>
            </div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

const Hero = (props: any) => {
  return (
    <div
      className={cn(
        'container relative w-full mx-auto px-6 pt-2 pb-0 sm:px-16 xl:px-20',
        props.className
      )}
    >
      <div className="flex flex-col text-center items-center">
        {/* {props.image &&
        (props.image && typeof props.image === 'string' ? (
          <div className="relative w-full max-w-[630px] mx-auto z-0 aspect-[2.3/1] -mt-8 -mb-8 md:-mb-12 lg:-mb-24">
            <Image
              src={props.image}
              priority
              layout="fill"
              objectFit="contain"
              objectPosition="top"
              alt=""
            />
          </div>
        ) : (
          <div className="col-span-12 lg:col-span-7 -mb-12 lg:mt-0 xl:col-span-6 xl:col-start-7">
            {props.image}
          </div>
        ))} */}
        <div className="w-12 h-12 min-w-12 shrink-0 my-4 md:mt-8 bg-background border flex items-center justify-center rounded-md">
          <svg
            className="h-6 w-6 text-foreground-light group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d={props.icon}
              stroke="currentColor"
            />
          </svg>
        </div>
        <div className="relative w-full z-10 flex flex-col items-center space-y-2 mx-auto max-w-2xl">
          <div>
            {props.icon || props.title ? (
              <div className="mb-2 flex justify-center items-center gap-3">
                {props.title && (
                  <span
                    className="text-brand font-mono uppercase tracking-widest text-sm"
                    key={`product-name-${props.title}`}
                  >
                    {props.title}
                  </span>
                )}
              </div>
            ) : null}
          </div>
          <div className={cn('will-change-transform flex flex-col gap-4 items-center')}>
            <h1 className="text-3xl md:text-5xl tracking-[-.5px] max-w-lg" key={`h1`}>
              {props.h1}
            </h1>
            <p className="p !text-foreground-light">{props.subheader}</p>
          </div>
          <div className="w-full sm:w-auto flex flex-col items-stretch sm:flex-row pt-2 sm:items-center gap-2">
            {props.cta && (
              <Button size="small" className="text-white" asChild>
                <Link href={props.cta.link} as={props.cta.link}>
                  {props.cta.label ?? 'Start for free'}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VectorPage

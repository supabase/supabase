import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { range } from 'lodash'

import { useBreakpoint } from 'common'
import { Badge, Button, IconCode, TextLink } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import ProductHeaderCentered from '~/components/Sections/ProductHeaderCentered'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'

import pageData from '~/data/partners'

const Partners = () => {
  const router = useRouter()
  const isSm = useBreakpoint()

  return (
    <>
      <NextSeo
        title={pageData.metaTitle}
        description={pageData.metaDescription}
        openGraph={{
          title: pageData.metaTitle,
          description: pageData.metaDescription,
          url: `https://supabase.com/partners`,
          images: [
            {
              url: `https://supabase.com${router.basePath}/images/og/integrations.png`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="relative bg-alternative overflow-hidden">
          <SectionContainer className="overflow-hidden pt-8 pb-12 md:pt-12">
            <ProductHeaderCentered {...pageData.heroSection} />
          </SectionContainer>
          <div className="relative z-20 w-full flex py-16 mb-16 -mt-10 md:mb-24 md:-mt-20 justify-center gap-2 overflow-hidden mx-auto max-w-4xl before:content[''] before:absolute before:inset-0 before:w-full before:bg-[linear-gradient(to_right,hsl(var(--background-alternative-default))_0%,transparent_10%,transparent_90%,hsl(var(--background-alternative-default))_100%)] before:z-10">
            <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full bg-alternative/90 backdrop-blur-2xl backdrop-filter from-background to-background-alternative border-4 border-background-alternative shadow-xl top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2 flex items-center justify-center z-30">
              <div className="absolute inset-0 w-full h-full transform">
                <svg
                  className="absolute inset-[-2px] transform animate-[transformSpin_3s_both_cubic-bezier(.5,.2,.5,.8)_infinite] opacity-90"
                  viewBox="0 0 182 183"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M91 1C120.005 1 145.841 14.5702 162.505 35.708"
                    stroke="url(#paint0_linear_4766_6117)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_4766_6117"
                      x1="107"
                      y1="2.5"
                      x2="151"
                      y2="21.5"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#1CF7C3" stopOpacity="0" />
                      <stop offset="0.510417" stopColor="#1CF7C3" />
                      <stop offset="1" stopColor="#1CF7C3" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <Image
                src="/images/supabase-logo-icon.svg"
                alt="Supabase icon"
                width={isSm ? 45 : 60}
                height={isSm ? 45 : 60}
              />
            </div>
            {range(0, 3).map((_) => (
              <div className="flex gap-2 animate-marquee will-change-transform">
                {pageData.featuredApps.map((app) => (
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gradient-to-t from-background to-background-alternative border border-background flex items-center justify-center shadow-xl">
                    <Image
                      src={app.logo}
                      alt={app.name}
                      width={isSm ? 24 : 45}
                      height={isSm ? 24 : 45}
                      className="w-8 h-8  overflow-hidden rounded-full"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_top,hsl(var(--background-alternative-default))_40%,hsl(var(--background-default))_90%)]" />
        </div>
        <SectionContainer>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4">
            <div className="col-span-1 lg:col-span-2">
              <h2 className="text-2xl sm:text-3xl xl:text-4xl tracking-[-.5px]">
                Explore our marketplace
              </h2>
              <p className="text-foreground-lighter text-xs sm:text-sm lg:text-base py-3 lg:max-w-md">
                Discover how technology and consulting partners are already working with Supabase.
              </p>
              <TextLink
                url="https://supabase.com/docs/guides/platform/marketplace"
                label="View docs"
              />
            </div>
            <div className="col-span-1 lg:col-span-3 w-full max-w-4xl grid gap-8 rounded md:grid-cols-2">
              <Panel
                hasShimmer
                hasActiveOnHover
                innerClassName="px-8 py-6 group flex flex-col gap-4"
              >
                <div className="bg-surface-200 mb-4 text-foreground flex h-12 w-12 items-center justify-center rounded-md border transition-all group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-foreground text-lg">Experts</h3>
                  <p className="text-muted text-sm">Find an expert to help build your next idea.</p>
                </div>

                <Link href="/partners/experts" className="absolute inset-0" />
              </Panel>
              <Panel
                hasInnerShimmer={false}
                hasActiveOnHover={true}
                innerClassName="px-8 py-6 group flex flex-col gap-4"
              >
                <div className="bg-surface-200 text-foreground flex h-12 w-12 items-center justify-center rounded-md border transition-all group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-foreground text-lg">Integrations</h3>
                  <p className="text-muted text-sm">Use your favorite tools with Supabase.</p>
                </div>
                <Link href="/partners/integrations" className="absolute inset-0" />
              </Panel>
            </div>
          </div>
        </SectionContainer>
        <SectionContainer className="!py-0">
          <div className="border-b" />
        </SectionContainer>
        <SectionContainer>
          <h2 className="text-2xl sm:text-3xl xl:text-4xl text-center tracking-[-.5px]">
            Partner benefits
          </h2>
          <div className="grid mt-8 lg:mt-16 gap-8 rounded md:grid-cols-2 xl:grid-cols-4">
            {pageData.featureBlocks.map((item, i) => {
              return (
                <div
                  className="group flex flex-col items-center text-center gap-4 px-8 py-6"
                  key={i}
                >
                  <div className="bg-brand-300 [[data-theme*=dark]_&]:bg-brand-500 text-brand-1200 group-hover:text-brand-800 [[data-theme*=dark]_&]:group-hover:text-brand-1000 flex h-12 w-12 items-center justify-center rounded-md border border-brand transition-all group-hover:scale-105">
                    {item.icon ? item.icon : <IconCode strokeWidth={2} />}
                  </div>

                  <div>
                    <h3 className="text-foreground text-lg">{item.title}</h3>
                    <p className="text-muted text-sm">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionContainer>
        <div className="bg-alternative border-t border-b">
          <SectionContainer className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 justify-between">
              <div className="w-full lg:w-1/2 gap-2 flex flex-col items-start">
                <Badge>Beta</Badge>
                <h2 className="text-3xl xl:text-4xl mt-2 max-w-[280px] sm:max-w-xs xl:max-w-[360px] tracking-[-1px]">
                  Publish an OAuth App
                </h2>
                <p className="text-muted mb-4 max-w-sm">
                  Supabase lets you build a third-party app that can control organizations or
                  projects programmatically.
                </p>
                <TextLink
                  url="https://supabase.com/docs/guides/platform/oauth-apps/publish-an-oauth-app"
                  label="Learn more"
                />
              </div>
              <div className="relative w-full lg:w-1/2 border bg-background flex items-center justify-center aspect-video rounded-xl overflow-hidden">
                <Image
                  src="/images/partners/register-oauth-app.svg"
                  alt="Register app via API"
                  layout="fill"
                  objectFit="cover"
                  quality={100}
                />
              </div>
            </div>
          </SectionContainer>
        </div>
        <SectionContainer>
          <div className="flex flex-col text-center gap-4 py-8 items-center justify-center">
            <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">
              Reach out to partner with Supabase
            </h2>
            <div className="w-full mt-4 flex items-center justify-center text-center gap-4">
              <Button asChild size="medium">
                <Link href="https://forms.supabase.com/partner" tabIndex={-1}>
                  Become a Partner
                </Link>
              </Button>
            </div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default Partners

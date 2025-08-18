'use client'

import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import DefaultLayout from 'components/Layouts/Default'
import CTABanner from 'components/CTABanner'
import { Button } from 'ui'
import { MDXRemote } from 'next-mdx-remote'
import mdxComponents from 'lib/mdx/mdxComponents'

type CaseStudyClientProps = {
  blog: any
  prevPost: any | null
  nextPost: any | null
}

export default function CaseStudyClient({ blog, prevPost, nextPost }: CaseStudyClientProps) {
  const {
    about,
    company_url,
    content,
    date,
    description,
    logo,
    meta_description,
    meta_title,
    misc,
    name,
    slug,
    title,
  } = blog

  return (
    <DefaultLayout>
      <div className="container mx-auto p-8 sm:py-16 sm:px-16 xl:px-20">
        <div className="grid grid-cols-12 gap-4">
          <div className="hidden xl:block col-span-12 mb-2 xl:col-span-2">
            <Link
              href="/customers"
              className="text-foreground-lighter hover:text-foreground flex cursor-pointer items-center text-sm transition"
            >
              <ChevronLeft style={{ padding: 0 }} />
              Back
            </Link>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <article className="flex flex-col gap-8">
              <div className="flex flex-col gap-4 sm:gap-8 max-w-xxl">
                <Link href="/customers" className="text-brand hover:text-brand-600 sm:mb-2 mt-0">
                  Customer Stories
                </Link>
                <h1 className="text-foreground text-4xl font-semibold xl:text-5xl">{title}</h1>
                <p className="text-foreground text-xl xl:text-2xl">{description}</p>
              </div>

              <div className="grid grid-cols-12 prose max-w-none gap-8 lg:gap-20">
                <div className="col-span-12 lg:col-span-4 lg:block xl:col-span-4">
                  <div className="space-y-8 lg:sticky lg:top-24 lg:mb-24">
                    <div className="relative h-16 w-32 lg:mt-5">
                      <Image
                        fill
                        src={logo}
                        alt={`${title} logo`}
                        priority
                        placeholder="blur"
                        blurDataURL="/images/blur.png"
                        draggable={false}
                        className="bg-no-repeat object-left object-contain m-0 [[data-theme*=dark]_&]:brightness-200 [[data-theme*=dark]_&]:contrast-0 [[data-theme*=dark]_&]:filter"
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <span className="text-foreground-lighter">About</span>
                      <p>{about}</p>
                      {company_url && (
                        <span className="not-prose ">
                          <a
                            href={company_url}
                            className="flex cursor-pointer items-center space-x-1 transition-opacity text-foreground-lightround-ligtext-foreground-light:text-foreground-light"
                            target="_blank"
                          >
                            <span>{company_url}</span>
                            <ExternalLink size={14} />
                          </a>
                        </span>
                      )}
                    </div>

                    {misc?.map((x: any) => (
                      <div className="flex flex-col gap-0" key={x.label}>
                        <span className="text-foreground-lighter">{x.label}</span>
                        <span className="text-foreground-light">{x.text}</span>
                      </div>
                    ))}

                    <div>
                      <p>Ready to get started?</p>
                      <div>
                        <Button asChild type="default" iconRight={<ChevronRight />}>
                          <Link
                            href="https://supabase.com/contact/enterprise"
                            className="no-underline"
                          >
                            Contact sales
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="xm:col-span-7 col-span-12 lg:col-span-8 xl:col-span-8 ">
                  <MDXRemote {...content} components={mdxComponents()} />
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <CTABanner />
    </DefaultLayout>
  )
}

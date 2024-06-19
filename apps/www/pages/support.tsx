import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import Typed from 'typed.js'
import { Button, ButtonProps, cn, IconCommand, IconSearch } from 'ui'
import { SearchButton } from 'ui-patterns/Cmdk'

import DefaultLayout from '~/components/Layouts/Default'
import Panel from '~/components/Panel'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { questions } from 'shared-data'
import data from '~/data/support'

const Index = () => {
  const router = useRouter()
  const typerRef = useRef(null)

  useEffect(() => {
    const typed = new Typed(typerRef.current, {
      strings: questions,
      typeSpeed: 50,
      backDelay: 4000,
      showCursor: false,
    })

    return () => {
      // Destroy Typed instance during cleanup to stop animation
      typed.destroy()
    }
  }, [])

  return (
    <>
      <NextSeo
        title={data.meta_title}
        description={data.meta_description}
        openGraph={{
          title: data.meta_title,
          description: data.meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout className="!min-h-fit">
        <div className="bg-alternative">
          <SectionContainer className="space-y-2 text-center">
            <h1 className="text-brand font-mono text-base uppercase tracking-widest">
              {data.hero.h1}
            </h1>
            <p className="h1 tracking-[-1px]">{data.hero.title}</p>
            <SearchButton className="mx-auto w-full max-w-lg">
              <div
                className="
                  flex
                  px-3
                  py-3
                  group
                  items-center
                  justify-between
                  bg-background
                  border
                  border-control
                  hover:bg-surface-100
                  transition 
                  rounded"
              >
                <div className="flex items-center flex-1 space-x-2">
                  <IconSearch className="text-foreground-light" size={18} strokeWidth={2} />
                  <p
                    ref={typerRef}
                    className="text-foreground-lighter text-sm group-hover:text-foreground-light transition"
                  />
                </div>
                <div className="flex items-center h-full space-x-1">
                  <div className="hidden text-foreground-lighter md:flex items-center justify-center h-5 w-10 border rounded bg-surface-300 border-foreground-lighter/30 gap-1">
                    <IconCommand size={12} strokeWidth={1.5} />
                    <span className="text-[12px]">K</span>
                  </div>
                </div>
              </div>
            </SearchButton>
          </SectionContainer>
        </div>
        <SectionContainer className="text grid gap-5 md:grid-cols-2 xl:grid-cols-3 max-w-7xl !pb-8">
          {data.cards.map((card) => (
            <Panel
              key={card.title}
              outerClassName={cn(card.className)}
              innerClassName="flex flex-col p-5"
            >
              <div className="mb-4 lg:mb-8 flex-1">
                <h2 className="text text-lg font-medium">{card.title}</h2>
                <div className="my-2 block">
                  <p className="text-foreground-light">{card.paragraph}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {card.links.map((link) => (
                  <Button
                    size="small"
                    type={(link.type as ButtonProps['type']) ?? 'default'}
                    iconRight={link.icon}
                    asChild
                  >
                    <Link href={link.link} as={link.link} target={link.target}>
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </Panel>
          ))}
        </SectionContainer>
        <SectionContainer className="!pt-0 max-w-7xl">
          <div className="mx-auto bg-alternative border rounded-xl p-6 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xl:gap-16 justify-between">
              <div className="gap-2 flex flex-col">
                <h2 className="text-xl lg:text-2xl tracking-tight">{data.banner.title}</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">{data.banner.paragraph}</div>
                <div className="flex gap-2">
                  {data.banner.links.map((link) => (
                    <Button
                      size="tiny"
                      type={(link.type as ButtonProps['type']) ?? 'default'}
                      iconRight={link.icon}
                      asChild
                    >
                      <Link
                        href={link.link}
                        as={link.link}
                        target={link.target}
                        className={cn(link.className)}
                      >
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default Index

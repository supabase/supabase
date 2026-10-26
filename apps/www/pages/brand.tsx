import { VectorLogo } from '~/components/BrandAssets/VectorLogo'
import { LogoGallery } from '~/components/BrandAssets/LogoGallery'
import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { CircleCheckFilled, CrossfadeIcon } from '~/components/CrossfadeIcon'
import Container from 'components/Container'
import CTABanner from 'components/CTABanner/index'
import { NextSeo } from 'next-seo'
import type { InferGetStaticPropsType } from 'next'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button, copyToClipboard } from 'ui'

const Index = ({ guideText }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [isPromptCopied, setIsPromptCopied] = useState(false)
  const meta_title = 'Brand Guidelines: Logos and Icons | Supabase'
  const meta_description =
    'Official Supabase logos and colors, as SVG and PNG files for light and dark backgrounds'

  const handlePromptCopy = () => {
    copyToClipboard(
      'Read https://supabase.com/brand.md and use the official Supabase logo file that fits the background where the logo will appear. Do not change the logo.',
      () => {
        setIsPromptCopied(true)
        setTimeout(() => setIsPromptCopied(false), 2000)
      }
    )
  }

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: 'https://supabase.com/brand',
          images: [
            {
              url: `https://supabase.com/images/og/supabase-og.png`,
            },
          ],
        }}
      />
      <Layout>
        <Container>
          <section className="relative isolate overflow-clip">
            <SectionContainer className="flex flex-col items-center gap-4 pt-0 text-center sm:pt-0 md:pt-0">
              <VectorLogo guideText={guideText} className="pb-12" />
              <h1 className="m-0 text-5xl tracking-tight text-foreground sm:text-6xl">
                Brand Guidelines
              </h1>
              <p className="m-0 max-w-xl text-balance text-sm text-foreground-lighter">
                Official Supabase logos and colors, as SVG and PNG files for light and dark
                backgrounds{' '}
                <a
                  href="#icon"
                  className="hit-area-2 text-xs text-foreground-light underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  <span aria-hidden>⤵</span>
                  <span className="sr-only">Go to the logo files</span>
                </a>
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Button asChild size="small">
                  <a href="/brand-assets.zip" download>
                    Download logo kit
                  </a>
                </Button>
                <Button
                  size="small"
                  onClick={handlePromptCopy}
                  icon={
                    <CrossfadeIcon
                      isActive={isPromptCopied}
                      activeIcon={<CircleCheckFilled className="size-3.5" />}
                      inactiveIcon={<Copy className="size-3.5" />}
                    />
                  }
                >
                  Copy agent prompt
                </Button>
                <span className="sr-only" role="status">
                  {isPromptCopied ? 'Agent prompt copied' : ''}
                </span>
              </div>
            </SectionContainer>
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-border to-transparent"
            />
          </section>
          <LogoGallery className="pb-0 md:pb-0" />
          <div className="section-container flex flex-col gap-20 pt-20 pb-16 md:pb-24">
            <section className="flex max-w-2xl flex-col gap-2">
              <h2 className="m-0 text-3xl tracking-tight text-foreground">Which file to use</h2>
              <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-pretty text-base text-foreground-light">
                <li>
                  Choose the file for the background where the logo appears, not for your browser or
                  editor theme.
                </li>
                <li>All files have a transparent background.</li>
              </ul>
            </section>
            <section className="flex max-w-2xl flex-col gap-2">
              <h2 className="m-0 text-3xl tracking-tight text-foreground">Name</h2>
              <p className="m-0 text-pretty text-base text-foreground-light">
                Write Supabase as one word, with a capital S. Do not write SupaBase or Supa Base.
              </p>
            </section>
            <section className="flex max-w-2xl flex-col gap-2">
              <h2 className="m-0 text-3xl tracking-tight text-foreground">Usage</h2>
              <p className="m-0 text-pretty text-base text-foreground-light">
                Use the Supabase logos only to refer to Supabase. Do not change the files or the
                logo colors.
              </p>
              <p className="m-0 text-pretty text-base text-foreground-light">
                Supabase and the Supabase logo are trademarks of Supabase Inc.
              </p>
            </section>
          </div>
          <div
            aria-hidden
            className="h-px bg-linear-to-r from-transparent via-border to-transparent"
          />
          <CTABanner className="border-t-0" />
        </Container>
      </Layout>
    </>
  )
}

// the hero guides are made of the team names, from the docs humans.txt
export const getStaticProps = async () => {
  const humans = await readFile(
    path.join(process.cwd(), '..', 'docs', 'public', 'humans.txt'),
    'utf8'
  )
  const lines = humans.split('\n').map((line) => line.trim())
  // the names sit between the team intro sentence and the first rule
  const names = lines
    .slice(
      lines.indexOf('TEAM') + 1,
      lines.findIndex((line) => line.startsWith('_'))
    )
    .filter(Boolean)
    .slice(1)
  return { props: { guideText: `${names.join(' + ')} + `.toUpperCase() } }
}

export default Index

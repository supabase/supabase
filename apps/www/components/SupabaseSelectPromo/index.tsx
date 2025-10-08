import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from 'ui'
import { DecorativeProgressBar } from '~/components/SurveyResults/DecorativeProgressBar'
import './styles.css'

const SupabaseSelectPromo = () => {
  const monoStyle = 'text-sm font-mono uppercase leading-none tracking-wide text-white/50'
  const gridUnit = 24
  const logoWidth = 320
  const speakerImgWidth = gridUnit * 12 // 288px
  const gridWidth = gridUnit * 26 // 624px
  const selectSiteUrl = 'https://select.supabase.com/'
  const headerText = ['Our first user conference', 'Oct 3 2025', '@ YC Offices, SF']
  const mainText = [
    'The conference for builders',
    'Speakers include Figma CEO Dylan Field, Vercel CEO Guillermo Rauch, and Firebase Co-Founder James Tamplin',
  ]
  const speakers = [
    {
      name: 'Dylan Field',
      slug: 'dylan-field',
      title: 'CEO of Figma',
    },
    {
      name: 'Guillermo Rauch',
      slug: 'guillermo-rauch',
      title: 'CEO of Vercel',
    },
    {
      name: 'James Tamplin',
      slug: 'james-tamplin',
      title: 'Co-Founder of Firebase',
    },
  ]

  return (
    <section
      className="dark bg-black overflow-hidden"
      style={{
        fontFamily:
          "SuisseIntl-Book, custom-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Main centered content */}
      <div
        className="container relative mx-auto px-6 lg:px-16 xl:px-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border-muted)) 1px, transparent 1px)',
          backgroundPosition: '56px 0',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '1px 100%',
        }}
      >
        <div className="w-full border-x border-muted py-16 md:py-24 lg:py-24">
          {/* Header */}
          <header className="flex flex-row border-y border-muted">
            {Object.entries(headerText).map(([index, value]: [string, string]) => (
              <p
                key={index}
                className={`${monoStyle} pr-8 border-r border-muted pt-8 last:pr-0 last:border-r-0`}
              >
                {value}
              </p>
            ))}
          </header>
          {/* Main text, CTA, and images */}
          <div className="relative">
            {/* Speaker image */}
            <Image
              src={`/images/supabase-select/speakers/${speakers[0].slug}.jpg`}
              alt={speakers[0].name}
              className="absolute top-0 -right-[0.5px] hidden lg:block z-10"
              style={{ width: `${speakerImgWidth - 1}px` }}
              width={speakerImgWidth - 1}
              height={speakerImgWidth - 1}
            />
            {/* Logo and speaker name */}
            <div className="h-24 border-b border-muted flex flex-row justify-between items-end">
              {/* Logo */}
              <Link
                target="_blank"
                href={selectSiteUrl}
                className="inline-block transition-opacity hover:opacity-80"
              >
                <Image
                  src="/images/supabase-select/logo.svg"
                  alt="Supabase Select"
                  className="transform translate-y-3"
                  style={{ width: `${logoWidth}px` }}
                  width={logoWidth}
                  height={logoWidth}
                />
              </Link>
              {/* Speaker name */}
              <p
                className={`${monoStyle} pr-1 hidden lg:inline-block text-right`}
                style={{ marginRight: `${speakerImgWidth}px` }}
              >
                {speakers[0].name}, {speakers[0].title}
              </p>
            </div>

            <div className="relative h-[288px] border-b border-muted flex flex-col justify-between">
              {/* Grid background */}
              <div
                className="hidden lg:block absolute -top-[1px] -right-[1px] border-r border-b border-muted"
                style={{
                  width: `${gridWidth}px`,
                  height: `${gridWidth}px`,
                  backgroundImage: `
                linear-gradient(to right, hsl(var(--border-muted)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border-muted)) 1px, transparent 1px)
              `,
                  backgroundSize: `${gridUnit}px ${gridUnit}px`,
                }}
              />
              <div
                className="hidden xl:block absolute top-0 right-0 h-full"
                style={{
                  width: `${gridWidth}px`,
                }}
              >
                <DecorativeProgressBar align="end" />
              </div>
              {/* Main text */}
              <div className="flex flex-col pt-16 text-balance relative">
                <h3 className="text-2xl text-light pb-2 max-w-md">{mainText[0]}</h3>
                <p className="text-2xl text max-w-md">{mainText[1]}</p>
              </div>
              {/* CTA */}
              <Button asChild type="primary" size="large" className="w-fit">
                <Link target="_blank" href={selectSiteUrl}>
                  Apply now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { SupabaseSelectPromo as default }

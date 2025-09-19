// import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import './styles.css'

const SupabaseSelectPromo = () => {
  const monoStyle = 'text-xs font-mono uppercase leading-none tracking-wide text-white/50'
  const imgWidth = 320
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
      className="dark bg-black"
      style={{
        fontFamily:
          "SuisseIntl-Book, custom-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Text contents */}
      <div className="border-x border-muted m:py-18 container relative mx-auto py-16 md:py-24 lg:py-24 before:absolute before:left-0 before:top-0 before:w-px before:h-full before:bg-muted before:-left-6">
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
        {/* Content area */}
        <div className="relative">
          {/* Speaker image */}
          <Image
            src={`/images/supabase-select/speakers/${speakers[0].slug}.jpg`}
            alt={speakers[0].name}
            className="w-80 absolute top-0 right-0"
            width={imgWidth}
            height={imgWidth}
          />
          {/* Logo and speaker name */}
          <div className="pt-8 border-b border-muted flex flex-row justify-between items-baseline">
            <Link
              target="_blank"
              href={selectSiteUrl}
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src="/images/supabase-select/logo.svg"
                alt="Supabase Select"
                className="w-80 transform translate-y-4 pb-1"
                width={240}
                height={40}
              />
            </Link>
            <p className={`${monoStyle} mr-[${imgWidth}px] pr-1`}>
              {speakers[0].name}, {speakers[0].title}
            </p>
          </div>

          {/* Main text */}
          <div className="flex flex-col pt-16 text-balance max-w-md">
            <h3 className="text-2xl text-light pb-2">{mainText[0]}</h3>
            <p className="text-2xl text">{mainText[1]}</p>
          </div>
          {/* CTA */}
          <div className="border-b border-muted pt-8">
            <Button asChild type="primary" size="large">
              <Link target="_blank" href={selectSiteUrl}>
                Apply now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { SupabaseSelectPromo as default }

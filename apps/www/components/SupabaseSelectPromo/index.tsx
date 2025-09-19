import Link from 'next/link'
import Image from 'next/image'

import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import './styles.css'

const SupabaseSelectPromo = () => {
  const selectSiteUrl = 'https://select.supabase.com/'
  const headerText = ['Our first user conference', 'Oct 3 2025', '@ YC Offices, SF']
  const mainText = [
    'The conference for builders',
    'Speakers include Figma CEO Dylan Field, Vercel CEO Guillermo Rauch, and Firebase Co-Founder James Tamplin',
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
      <div className="border-x border-muted m:py-18 container relative mx-auto py-16 md:py-24 lg:py-24">
        <header className="flex flex-row border-y border-muted">
          {Object.entries(headerText).map(([index, value]: [string, string]) => (
            // <div className="">
            <p
              key={index}
              className="text-xs font-mono uppercase leading-none tracking-wide text-white/50 pr-8 border-r border-muted pt-8 last:pr-0 last:border-r-0"
            >
              {value}
            </p>
            // </div>
          ))}
        </header>
        {/* Logo */}
        <div className="pt-8 border-b border-muted">
          <Link
            target="_blank"
            href={selectSiteUrl}
            className="inline-block -mb-[18px] transition-opacity hover:opacity-80"
          >
            <Image
              src="/images/supabase-select/logo.svg"
              alt="Supabase Select"
              className="w-80"
              width={240}
              height={40}
            />
          </Link>
        </div>
        {/* Main text */}
        <div className="flex flex-col pt-16 text-balance">
          <h3 className="text-2xl text-light">{mainText[0]}</h3>
          <p className="text-2xl text">{mainText[1]}</p>
        </div>
        {/* CTA */}
        <div className="border-b border-muted pt-8">
          <Button asChild type="primary" size="large">
            <Link href="/select">Apply now</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export { SupabaseSelectPromo as default }

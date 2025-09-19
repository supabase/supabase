import { Button } from 'ui'
import Link from 'next/link'

import SectionContainer from '~/components/Layouts/SectionContainer'
import './styles.css'

const SupabaseSelectPromo = () => {
  const headerText = ['Our first user conference', 'Oct 3 2025', '@ YC Offices, SF']
  const mainText = [
    'The conference for builders',
    'Speakers include Figma CEO Dylan Field, Vercel CEO Guillermo Rauch, and Firebase Co-Founder James Tamplin',
  ]

  return (
    <section
      className="dark bg-black py-16 md:py-24"
      style={{
        fontFamily:
          "SuisseIntl-Book, custom-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <header className="flex flex-row">
        {Object.entries(headerText).map(([index, value]: [string, string]) => (
          <p
            key={index}
            className="text-xs font-mono uppercase leading-none tracking-wide text-white/50 pr-8"
          >
            {value}
          </p>
        ))}
      </header>
      <div className="flex flex-col">
        <h3 className="text-2xl text-light">{mainText[0]}</h3>
        <p className="text-2xl text">{mainText[1]}</p>
      </div>

      <Button asChild type="primary" size="large">
        <Link href="/select">Apply now</Link>
      </Button>
    </section>
  )
}

export default SupabaseSelectPromo

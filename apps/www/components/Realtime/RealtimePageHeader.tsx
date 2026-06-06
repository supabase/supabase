'use client'

import Link from 'next/link'
import { Button } from 'ui'

import SectionContainer from '~/components/Layouts/SectionContainer'

export function RealtimePageHeader() {
  const scrollToPlayground = () => {
    document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <SectionContainer className="pb-0! pt-10! md:pt-12! lg:pt-14!">
      <div className="max-w-3xl">
        <h1 className="h1 text-foreground">Realtime</h1>
        <p className="mt-3 mb-8 max-w-xl text-lg text-foreground-light">
          Sync Postgres changes, presence, and custom events to every connected client.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="primary" size="large" asChild>
            <Link href="/docs/guides/realtime">View documentation</Link>
          </Button>
          <Button type="default" size="large" onClick={scrollToPlayground}>
            View examples
          </Button>
        </div>
      </div>
    </SectionContainer>
  )
}

import { Button } from 'ui'
import Link from 'next/link'

export function Hero() {
  return (
    <header className="container relative mx-auto px-6 pt-12 pb-8 lg:pt-24 lg:px-16 xl:px-20 text-center space-y-4">
      <h1 className="text-sm text-brand md:text-base">
        <span className="sr-only">Supabase </span>Contribute
      </h1>
      <h2 className="text-3xl md:text-4xl xl:text-5xl lg:max-w-2xl xl:max-w-3xl lg:mx-auto tracking-[-1px]">
        Help Build the Supabase Community
      </h2>
      <p className="text-sm md:text-base text-foreground-lighter max-w-sm sm:max-w-md md:max-w-lg mx-auto">
        Every question answered helps someone build something amazing. Browse unresolved threads
        from the last 24 hours and share your knowledge with fellow developers.
      </p>
    </header>
  )
}

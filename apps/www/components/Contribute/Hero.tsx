import { Button } from 'ui'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <header className="container relative mx-auto px-6 pt-12 pb-8 lg:pt-24 lg:px-16 xl:px-20 text-center space-y-4">
      <h1 className="text-sm text-brand md:text-base">
        <span className="sr-only">Supabase </span>Contribute
      </h1>
      <h2 className="text-3xl md:text-4xl xl:text-5xl lg:max-w-2xl xl:max-w-6xl lg:mx-auto tracking-[-1px]">
        Join the Supabase <br />
        Contributor Community
      </h2>
      <p className="text-sm md:text-base text-foreground-lighter max-w-sm sm:max-w-md md:max-w-xl mx-auto">
        Jump in to these unresolved threads and share your knowledge with fellow builders. Every
        question answered helps someone build something amazing.
      </p>
      <div className="grid gap-2 justify-center mt-6 text-foreground-lighter">
        Want to get involved?
        <Button asChild type="secondary" iconRight={<ArrowRight className="h-4 w-4" />}>
          <Link href="/contribute/about">Learn more</Link>
        </Button>
      </div>
    </header>
  )
}

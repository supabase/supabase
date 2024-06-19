import { Button } from 'ui'
import Link from 'next/link'
import Controller from './launch-controller.json'

export default function LaunchHero() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:gap-6">
        <h1 className="text-foreground text-4xl font-semibold tracking-tight md:text-5xl lg:text-7xl">
          {Controller.hero_header}
        </h1>
        <h2 className="text-foreground-light text-sm lg:text-xl">
          Stay tuned all week for daily announcements
        </h2>
      </div>
      <div className="flex gap-3">
        <Button asChild type="primary" size="small" className="text-white">
          <Link href="#launch-week-5-day-5">Latest release</Link>
        </Button>
        <Button asChild type="default" size="small">
          <Link href="#launch-week--hackathon">Join the Hackathon</Link>
        </Button>
      </div>
    </div>
  )
}

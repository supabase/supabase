import { Button } from '@supabase/ui'
import Link from 'next/link'
import Controller from './launch-controller.json'

export default function LaunchHero() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:gap-6">
        <h1 className="text-scale-1200 text-4xl font-semibold tracking-tight md:text-5xl lg:text-7xl">
          {Controller.hero_header}
        </h1>
        <h2 className="text-scale-1100 text-sm lg:text-xl">
          Stay tuned all week for daily announcements
        </h2>
      </div>
      <div className="flex gap-3">
        <Link href="#launch-week-5-day-5">
          <Button type="primary" size="small" className="text-white">
            Latest release
          </Button>
        </Link>
        <Link href="#launch-week--hackathon">
          <Button type="default" size="small">
            Join the Hackathon
          </Button>
        </Link>
      </div>
    </div>
  )
}

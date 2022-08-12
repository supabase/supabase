import { Button } from '@supabase/ui'
import Link from 'next/link'
import Controller from './launch-controller.json'

export default function LaunchHero() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:gap-8">
        <h1 className="text-scale-1200 text-4xl font-semibold tracking-tight md:text-5xl lg:text-8xl">
          {Controller.hero_header}
        </h1>
        <h2 className="text-scale-1100 text-sm lg:text-xl">
          Launch time is Monday 08:00 PT | 11:00 ET
        </h2>
      </div>
      <div className="flex gap-3">
        <Link href="#launch-week--schedule">
          <Button type="primary" size="small" className="text-white">
            View the schedule
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

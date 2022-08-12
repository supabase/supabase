import { TruckIcon } from '@heroicons/react/outline'
import { Button, Badge } from '@supabase/ui'
import Link from 'next/link'
import Controller from './launch-controller.json'

export default function LaunchHero() {
  return (
    <div className="flex flex-col gap-16 lg:grid lg:grid-cols-12" id="launch-week--hackathon">
      <div className="col-span-12 flex flex-col gap-12 lg:col-span-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-scale-1200 text-4xl tracking-tight">Launch Week Hackathon</h3>
            <div>
              <Badge>In progress</Badge>
            </div>
            <h4 className="text-scale-1100 text-xl">
              Submissions close Sunday 21st Aug 23:59 (PT).
            </h4>
          </div>

          <div className="flex gap-3">
            <Link href="https://www.madewithsupabase.com/launch-week-5">
              <Button type="primary" size="small" className="text-white">
                Submit your project
              </Button>
            </Link>
            <Link href="/blog/launch-week-5-hackathon">
              <Button type="default" size="small">
                Learn more
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-3">
            <h3 className="text-scale-1200 text-lg">Prizes</h3>
            <p className="text-scale-1100 text-sm">
              There are 5 categories to win. There will be a prize for the winner and a runner-up
              prize in each category.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-scale-1200 text-lg">Submission</h3>
            <p className="text-scale-1100 text-sm">
              Submit your project through{' '}
              <a className="text-brand-900" href="https://madewithsupabase.com">
                madewithsupabase.com
              </a>
              .
            </p>
            <p className="text-scale-1100 text-sm">
              All submissions must be open source and publically available.
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 lg:col-start-8">
        <div className="relative">
          <img
            className="z-10 w-full rounded-xl border"
            src="/images/launchweek/launchweek-day-placeholder.jpg"
            alt="Supabase"
          />
          <iframe
            className="absolute top-0 w-full rounded-xl"
            // width="100%"
            height="100%"
            src="https://www.youtube-nocookie.com/embed/rI3Ik7GyYEw"
            frameBorder="1"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  )
}

import { TruckIcon } from '@heroicons/react/outline'
import { Button, Badge } from '@supabase/ui'
import Controller from './launch-controller.json'

export default function LaunchHero() {
  return (
    <div className="flex grid grid-cols-12 flex-col gap-16">
      <div className="col-span-6 flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <div>
            <Badge>In progress</Badge>
          </div>
          <h3 className="text-scale-1200 tracking-tight lg:text-5xl">Hackathon updates</h3>
          <h4 className="text-scale-1100 text-xl">Submissions close Sunday 21st Aug 11:59 (PT)</h4>
        </div>

        <div className="flex gap-3">
          <Button type="primary" size="small" className="text-white">
            Submit project
          </Button>
          <Button type="default" size="small">
            Hackathon info
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-16">
          <div>
            <h3 className="text-scale-1200 text-lg">Prizes</h3>
            <p className="text-scale-1100 text-sm">
              There are 5 categories to win. There will be winner prize and a runner-up prize in
              each category.
            </p>
          </div>
          <div>
            <h3 className="text-scale-1200 text-lg">Submission</h3>
            <p className="text-scale-1100 text-sm">
              Submit your project through <a>madewithsupabase.com</a>. All submissions must be open
              source and publically available.
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-6">
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

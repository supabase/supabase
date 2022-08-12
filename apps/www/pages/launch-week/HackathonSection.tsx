import { Button } from '@supabase/ui'
import Controller from './launch-controller.json'

export default function LaunchHero() {
  return (
    <div className="flex grid grid-cols-12 flex-col gap-8">
      <div className="col-span-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-scale-1200 tracking-tight lg:text-5xl">Hackathon updates</h3>
          <h4 className="text-scale-1200 text-xl">Starting in 12 Hours </h4>
        </div>
        <div className="flex gap-3">
          <Button type="alternative" size="medium">
            View the schedule
          </Button>
          <Button type="default" size="medium">
            Hackathon info
          </Button>
        </div>
      </div>

      <div className="col-span-6">
        <iframe
          className="video-with-border w-full"
          width="640"
          height="385"
          src="https://www.youtube-nocookie.com/embed/rI3Ik7GyYEw"
          frameBorder="1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  )
}

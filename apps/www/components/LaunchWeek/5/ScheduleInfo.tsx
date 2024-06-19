import { Button } from 'ui'
import Link from 'next/link'

export function ScheduleInfo() {
  return (
    <div className="flex flex-col gap-16" id="launch-week--schedule">
      <div className="text-foreground flex flex-col gap-4 text-lg">
        <h3 className="text-foreground text-4xl">Week Schedule</h3>
        <p className="md:max-w-lg">
          Each day of the week we will announce a new item, every day, from Monday to Friday.
        </p>
        <p className="text-foreground-light text-base md:max-w-lg">
          The first launch will be on Monday 08:00 PT | 11:00 ET.
        </p>
      </div>
      <div className="flex flex-col gap-4 overflow-hidden rounded-md border bg-white shadow-sm md:max-w-lg">
        <div className="flex flex-col gap-3 p-10 pb-0">
          <h3 className="text-foreground text-lg">You can still win a lucky gold ticket</h3>
          <p className="text-foreground-light text-sm">
            A few of the lucky attendees for Launch Week will get a limited edition Supabase goodie
            bag.
          </p>
        </div>
        <div className="px-10">
          <Button asChild type="default">
            <Link href="/launch-week-register">Get a ticket</Link>
          </Button>
        </div>
        <img src="/images/launchweek/gold-ticket.svg" className="w-full" />
      </div>
    </div>
  )
}

export default ScheduleInfo

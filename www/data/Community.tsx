import { Card, Space, Typography } from '@supabase/ui'
import DeveloperSignups from 'data/DeveloperSignups'

type CommunityItem = {
  title: string
  stat: string
  statLabel: string
  detail: any // some component to show when selected
}

const data: CommunityItem[] = [
  {
    title: 'Developers',
    stat: '40,000',
    statLabel: 'Devs',
    detail: () => (
      <div className="mt-5 max-w-lg mx-auto grid gap-0 sm:grid-cols-3 lg:grid-cols-4 lg:max-w-none text-center border border-dashed rounded-lg overflow-hidden ">
        {DeveloperSignups.map((signup) => (
          <div className="col-span-1 flex justify-center py-8 px-8 border border-dashed">
            <img key={signup.title} className="max-h-12" src={signup.img} alt={signup.title} />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'GitHub',
    stat: '20,000',
    statLabel: 'STARS',
    detail: () => (
      <div>
        <Typography.Text>Some growth chart?</Typography.Text>
      </div>
    ),
  },
  {
    title: 'Twitter',
    stat: '17,000',
    statLabel: 'Followers',
    detail: () => (
      <div>
        <Typography.Text>Some twitter callouts</Typography.Text>
      </div>
    ),
  },
  {
    title: 'Discord',
    stat: '4,000',
    statLabel: 'SuperTroopers',
    detail: () => (
      <div>
        <Typography.Text>Something great</Typography.Text>
      </div>
    ),
  },
]

export default data

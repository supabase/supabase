import { Card, Space, Typography } from '@supabase/ui'
import DeveloperSignups from 'data/DeveloperSignups'

type CommunityItem = {
  title: string
  stat: string
  statLabel: string
  img: string
  detail: any // some component to show when selected
  invertImgDarkMode?: boolean
}

const data: CommunityItem[] = [
  {
    title: 'Developers',
    stat: '50,000+',
    statLabel: 'Registered developers',
    img: 'supabase.png',
    detail: () => (
      <div className="mt-5 max-w-lg mx-auto grid gap-0 sm:grid-cols-3 lg:grid-cols-4 lg:max-w-none text-center border border-dashed rounded-lg overflow-hidden ">
        {DeveloperSignups.map((signup) => (
          <div
            key={signup.title}
            className="col-span-1 flex justify-center py-8 px-8 border border-dashed"
          >
            <img key={signup.title} className="max-h-12" src={signup.img} alt={signup.title} />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'GitHub',
    stat: '30,000+',
    statLabel: 'GitHub stars',
    img: 'github.png',
    invertImgDarkMode: true,
    detail: () => (
      <div>
        <Typography.Text>Some growth chart?</Typography.Text>
      </div>
    ),
  },
  {
    title: 'Twitter',
    stat: '26,000+',
    statLabel: 'Followers',
    img: 'twitter.png',
    detail: () => (
      <div>
        <Typography.Text>Some twitter callouts</Typography.Text>
      </div>
    ),
  },
  {
    title: 'Discord',
    stat: '6,000+',
    statLabel: 'SuperTroopers',
    img: 'discord.png',
    detail: () => (
      <div>
        <Typography.Text>Something great</Typography.Text>
      </div>
    ),
  },
]

export default data

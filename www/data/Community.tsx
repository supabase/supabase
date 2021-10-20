import { Card, Space, Typography } from '@supabase/ui'

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
      <div>
        <Typography.Text>All the awesome logos we have for developers</Typography.Text>
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

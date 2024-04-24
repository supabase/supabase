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
    stat: '450,000+',
    statLabel: 'Registered developers',
    img: 'supabase.png',
    detail: () => (
      <div className="mx-auto mt-5 grid max-w-lg gap-0 overflow-hidden rounded-lg border border-dashed text-center sm:grid-cols-3 lg:max-w-none lg:grid-cols-4 ">
        {DeveloperSignups.map((signup) => (
          <div
            key={signup.title}
            className="col-span-1 flex justify-center border border-dashed py-8 px-8"
          >
            <img key={signup.title} className="max-h-12" src={signup.img} alt={signup.title} />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'GitHub',
    stat: '58,000+',
    statLabel: 'GitHub stars',
    img: 'github.png',
    invertImgDarkMode: true,
    detail: () => (
      <div>
        <p>Some growth chart?</p>
      </div>
    ),
  },
  {
    title: 'Twitter',
    stat: '100,000+',
    statLabel: 'Followers',
    img: 'twitter.png',
    detail: () => (
      <div>
        <p>Some twitter callouts</p>
      </div>
    ),
  },
  {
    title: 'Discord',
    stat: '17,000+',
    statLabel: 'SupaTroopers',
    img: 'discord.png',
    detail: () => (
      <div>
        <p>Something great</p>
      </div>
    ),
  },
]

export default data

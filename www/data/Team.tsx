import { Card, Space, Typography } from '@supabase/ui'
import DeveloperSignups from 'data/DeveloperSignups'

type TeamMember = {
  name: string
  img: string
  department: string
  github: string
  active: boolean
}

const data: TeamMember[] = [
  {
    name: 'Rory Wilding',
    github: 'https://github.com/roryw10',
    img: 'https://github.com/roryw10.png',
    department: 'Growth',
    active: true,
  },
  {
    name: 'Ant Wilson',
    github: 'https://github.com/awalias',
    img: 'https://github.com/awalias.png',
    department: 'Cofounder',
    active: true,
  },
  {
    name: 'Paul Copplestone',
    github: 'https://github.com/kiwicopple',
    img: 'https://github.com/kiwicopple.png',
    department: 'Cofounder',
    active: true,
  },
  {
    name: 'Angelico de los Reyes',
    github: 'https://github.com/dragarcia',
    img: 'https://github.com/dragarcia.png',
    department: 'Engineering',
    active: true,
  },
  {
    name: 'Thor Schaeff',
    github: 'https://github.com/thorwebdev',
    img: 'https://github.com/thorwebdev.png',
    department: 'DevRel',
    active: true,
  },
  {
    name: 'Inian Parameshwaran',
    github: 'https://github.com/inian',
    img: 'https://github.com/inian.png',
    department: 'Engineering',
    active: true,
  },
  {
    name: 'Bobbie Soedirgo',
    github: 'https://github.com/soedirgo',
    department: 'Engineering',
    img: 'https://github.com/soedirgo.png',
    active: true,
  },
  {
    name: 'Francesco Ceccon',
    github: 'https://github.com/fracek',
    department: 'Engineering',
    img: 'https://github.com/fracek.png',
    active: false,
  },
  {
    name: 'Steve Chavez',
    github: 'https://github.com/steve-chavez',
    department: 'Engineering & PostgREST maintainer',
    img: 'https://github.com/steve-chavez.png',
    active: true,
  },
  {
    name: 'Kang Ming Tay',
    github: 'https://github.com/kangmingtay',
    department: 'Engineering',
    img: 'https://github.com/kangmingtay.png',
    active: true,
  },
  {
    name: 'Div Arora',
    github: 'https://github.com/darora',
    department: 'Engineering',
    img: 'https://github.com/darora.png',
    active: true,
  },
]

export default data

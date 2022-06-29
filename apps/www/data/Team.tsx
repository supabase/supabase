type TeamMember = {
  name: string
  img: string
  department: string
  active: boolean

  github?: string
  twitter?: string
  linkedin?: string
}

const data: TeamMember[] = [
  {
    name: 'Caryn Marooney',
    img: 'https://res.cloudinary.com/crunchbase-production/image/upload/c_thumb,h_256,w_256,f_auto,g_faces,z_0.7,q_auto:eco,dpr_1/iqltjymln82pxxcwr6kq.png',
    department: 'Board member',
    twitter: 'https://twitter.com/carynm650',
    active: true,
  },
  {
    name: 'Paul Copplestone',
    github: 'https://github.com/kiwicopple',
    img: 'https://github.com/kiwicopple.png',
    department: 'Cofounder',
    twitter: 'https://twitter.com/kiwicopple',
    active: true,
  },
  {
    name: 'Ant Wilson',
    github: 'https://github.com/awalias',
    img: 'https://github.com/awalias.png',
    department: 'Cofounder',
    twitter: 'https://twitter.com/antwilson',
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
    name: 'Hieu Pham',
    github: 'https://github.com/phamhieu',
    department: 'Engineering',
    img: 'https://github.com/phamhieu.png',
    twitter: 'https://twitter.com/phamhieu_',
    active: true,
  },
  {
    name: 'Joshen Lim',
    github: 'https://github.com/joshenlim',
    department: 'Engineering, Design',
    img: 'https://github.com/joshenlim.png',
    twitter: 'https://twitter.com/joshenlimek',
    active: true,
  },
  {
    name: 'Steve Chavez',
    github: 'https://github.com/steve-chavez',
    department: 'Engineering & PostgREST maintainer',
    img: 'https://github.com/steve-chavez.png',
    twitter: 'https://twitter.com/_steve_chavez',
    active: true,
  },
  {
    name: 'Chris Copplestone',
    github: '',
    department: 'Corp',
    img: 'https://ca.slack-edge.com/TS93YE5NV-U0131589GCX-8ceb0013e47a-512',
    active: true,
  },
  {
    name: 'Rory Wilding',
    github: 'https://github.com/roryw10',
    img: 'https://github.com/roryw10.png',
    department: 'Growth',
    twitter: 'https://twitter.com/Rorstro',
    active: true,
  },
  {
    name: 'Inian Parameshwaran',
    github: 'https://github.com/inian',
    img: 'https://github.com/inian.png',
    department: 'Engineering',
    twitter: 'https://twitter.com/everConfusedGuy',
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
    name: 'Jonathan Summers-Muir',
    github: 'https://github.com/mildtomato',
    department: 'Design, Engineering',
    img: 'https://github.com/mildtomato.png',
    twitter: 'https://twitter.com/JSummersMuir',
    active: true,
  },
  {
    name: 'Wen Bo Xi',
    github: 'https://github.com/w3b6x9',
    department: 'Engineering',
    img: 'https://github.com/w3b6x9.png',
    active: true,
  },
  {
    name: 'Div Arora',
    github: 'https://github.com/darora',
    department: 'Engineering',
    img: 'https://github.com/darora.png',
    active: true,
  },
  {
    name: 'Thor Schaeff',
    github: 'https://github.com/thorwebdev',
    img: 'https://github.com/thorwebdev.png',
    department: 'DevRel',
    twitter: 'https://twitter.com/thorwebdev',
    active: true,
  },
  {
    name: 'Mark Burggraf',
    github: 'https://github.com/burggraf',
    department: 'Engineering',
    img: 'https://github.com/burggraf.png',
    active: true,
  },
  {
    name: 'Kang Ming Tay',
    github: 'https://github.com/kangmingtay',
    department: 'Engineering',
    img: 'https://github.com/kangmingtay.png',
    twitter: 'https://twitter.com/kangmingtay',
    active: true,
  },
  {
    name: 'Amy Quek',
    github: '',
    department: 'Marketing',
    img: 'https://ca.slack-edge.com/TS93YE5NV-U023L5A1ER0-613a55cd13b7-512',
    twitter: 'https://twitter.com/QuekAmy',
    active: true,
  },
  {
    name: 'Stanislav Muzhy',
    github: 'https://github.com/abc3',
    department: 'Engineering',
    img: 'https://github.com/abc3.png',
    twitter: 'https://twitter.com/abc3erl',
    active: true,
  },
  {
    name: 'Leo Tanad',
    github: 'https://github.com/ltanady',
    department: 'Engineering',
    img: 'https://github.com/ltanady.png',
    active: true,
  },
  {
    name: 'Oliver Ric',
    github: 'https://github.com/olirice',
    department: 'Engineering',
    img: 'https://github.com/olirice.png',
    active: true,
  },
  {
    name: 'Beng Eu',
    github: 'https://github.com/thebengeu',
    department: 'Engineering',
    img: 'https://github.com/thebengeu.png',
    twitter: 'https://twitter.com/thebengeu',
    active: true,
  },
  {
    name: 'Gurjeet Sing',
    github: 'https://github.com/gurjeet',
    department: 'Engineering',
    img: 'https://github.com/gurjeet.png',
    active: true,
  },
  {
    name: 'Laura Copplestone',
    github: 'https://github.com/??',
    department: 'Corp',
    img: 'https://ca.slack-edge.com/TS93YE5NV-U0267HUR09J-35f4554b6def-512',
    active: true,
  },
  {
    name: 'Jon Meyer',
    github: 'https://github.com/dijonmusters',
    department: 'DevRel',
    img: 'https://github.com/dijonmusters.png',
    twitter: 'https://twitter.com/_dijonmusters',
    active: true,
  },
]

export default data

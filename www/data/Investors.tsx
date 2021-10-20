

type Investor = {
  name: string
  round: 'SEED' | 'A'
  title: string
  img: string
  lead: boolean
  twitter?: string
}

const data: Investor[] = [
  {
    name: 'Coatue',
    round: 'SEED',
    title: 'Coatue Growth Fund',
    img: 'false',
    lead: true,
  },
  {
    name: 'Mozilla',
    round: 'SEED',
    title: 'Mozilla',
    img: 'false',
    lead: true,
  },
  {
    name: 'Y Combinator',
    round: 'A',
    title: 'CEO @ Vercel',
    img: 'false',
    lead: true,
  },
  {
    name: 'Tom Preston-Warner',
    round: 'A',
    title: 'Cofounder @ GitHub',
    img: 'false',
    lead: false,
  },
  {
    name: 'Solomon Hykkes',
    round: 'A',
    title: 'Cofounder @ Docker',
    img: 'false',
    lead: false,
  },
  {
    name: 'Guillermo Rauch',
    round: 'A',
    title: 'CEO @ Vercel',
    img: 'false',
    lead: false,
  },
]

export default data

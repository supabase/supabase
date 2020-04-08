import React from 'react'
import Filter from './filters/filter.mdx'
import Not from './filters/not.mdx'
import Match from './filters/match.mdx'
import Eq from './filters/eq.mdx'
import Neq from './filters/neq.mdx'
import Gt from './filters/gt.mdx'
import Lt from './filters/lt.mdx'
import Gte from './filters/gte.mdx'
import Lte from './filters/lte.mdx'
import Like from './filters/like.mdx'
import Ilike from './filters/ilike.mdx'
import Is from './filters/is.mdx'
import In from './filters/in.mdx'
import Cs from './filters/cs.mdx'
import Cd from './filters/cd.mdx'
import Ova from './filters/ova.mdx'
import Ovr from './filters/ovr.mdx'
import Sl from './filters/sl.mdx'
import Sr from './filters/sr.mdx'
import Nxl from './filters/nxl.mdx'
import Nxr from './filters/nxr.mdx'
import Adj from './filters/adj.mdx'


const filters = {
  filter: <Filter />,
  not: <Not />,
  match: <Match />,
  eq: <Eq />,
  neq: <Neq />,
  gt: <Gt />,
  lt: <Lt />,
  gte: <Gte />,
  lte: <Lte />,
  like: <Like />,
  ilike: <Ilike />,
  is: <Is />,
  in: <In />,
  cs: <Cs />,
  cd: <Cd />,
  ova: <Ova />,
  ovr: <Ovr />,
  sl: <Sl />,
  sr: <Sr />,
  nxl: <Nxl />,
  nxr: <Nxr />,
  adj: <Adj />
}

function CommonFilters(props) {
  var filter = props.filter.toLowerCase()
  return filters[filter]
}

export default CommonFilters

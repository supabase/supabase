import React from 'react'
import Filter from './filters/_filter.mdx'
import Not from './filters/_not.mdx'
import Match from './filters/_match.mdx'
import Eq from './filters/_eq.mdx'
import Neq from './filters/_neq.mdx'
import Gt from './filters/_gt.mdx'
import Lt from './filters/_lt.mdx'
import Gte from './filters/_gte.mdx'
import Lte from './filters/_lte.mdx'
import Like from './filters/_like.mdx'
import Ilike from './filters/_ilike.mdx'
import Is from './filters/_is.mdx'
import In from './filters/_in.mdx'
import Cs from './filters/_cs.mdx'
import Cd from './filters/_cd.mdx'
import Ova from './filters/_ova.mdx'
import Ovr from './filters/_ovr.mdx'
import Sl from './filters/_sl.mdx'
import Sr from './filters/_sr.mdx'
import Nxl from './filters/_nxl.mdx'
import Nxr from './filters/_nxr.mdx'
import Adj from './filters/_adj.mdx'
import Or from './filters/_or.mdx'


const filters = {
  filter: <Filter />,
  not: <Not />,
  match: <Match />,
  or: <Or />,
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

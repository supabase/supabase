import React from 'react'
import Filter from './filters/filter.mdx'
import Match from './filters/match.mdx'
import Eq from './filters/eq.mdx'
import Gt from './filters/gt.mdx'
import Lt from './filters/lt.mdx'
import Gte from './filters/gte.mdx'
import Lte from './filters/lte.mdx'
import Like from './filters/like.mdx'
import Ilike from './filters/ilike.mdx'
import Is from './filters/is.mdx'
import In from './filters/in.mdx'
import Not from './filters/not.mdx'

const filters = {
  filter: <Filter />,
  match: <Match />,
  eq: <Eq />,
  gt: <Gt />,
  lt: <Lt />,
  gte: <Gte />,
  lte: <Lte />,
  like: <Like />,
  ilike: <Ilike />,
  is: <Is />,
  in: <In />,
  not: <Not />,
}

function CommonFilters(props) {
  var filter = props.filter.toLowerCase()
  return filters[filter]
}

export default CommonFilters

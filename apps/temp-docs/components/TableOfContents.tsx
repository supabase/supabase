import { FC } from 'react'
import { removeAnchor } from './CustomHTMLElements/CustomHTMLElements.utils'

interface TOCHeader {
  id: number
  lvl: number
  seen: number
  content: string
  slug: string
}

interface Props {
  toc: any
}

const formatSlug = (slug: string) => {
  // [Joshen] We will still provide support for headers declared like this:
  //    ## REST API {#rest-api-overview}
  // At least for now, this was a docusaurus thing.
  if (slug.includes('#')) return slug.split('-#')[0]
  return slug
}

const TableOfContents: FC<Props> = ({ toc }) => {
  // [Joshen] markdown-toc doesn't seem to read maxdepth from the options passed in
  // Our first level headers will be H2s (H1 is ignored), and we only show up to H3

  return (
    <ul className="toc-menu list-none pl-4 text-[0.8rem] grid gap-2 mt-1">
      {(toc.json as TOCHeader[])
        .filter((item) => item.lvl !== 1 && item.lvl <= 3)
        .map((item: any, i: number) => {
          return (
            <li key={i} id={item.lvl} style={{ marginLeft: `${(item.lvl - 2) * 1}rem` }}>
              <a
                href={`#${formatSlug(item.slug)}`}
                className="text-scale-1000 hover:text-brand-900 transition-colors"
              >
                {removeAnchor(item.content)}
              </a>
            </li>
          )
        })}
    </ul>
  )
}

export default TableOfContents

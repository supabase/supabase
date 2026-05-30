import Link from 'next/link'
import { Article } from '../../types'

const ArticleButtonListItem = (props: Article) => {
  return (
    <Link href={props.url} className="group mr-2 mb-2">
      <div className="flex flex-col">
        <span className="text-foreground group-hover:text-brand text-left text-base transition">
          {props.title}
        </span>
        <p className="text-foreground-light text-left text-sm transition">{props.description}</p>
      </div>
    </Link>
  )
}

export default ArticleButtonListItem

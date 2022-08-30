import { NewspaperIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import { Article } from '../types'

const ArticleButtonListItem = (props: Article) => {
  return (
    <Link href={props.url}>
      <a className="group mr-2 mb-2">
        <div className="flex flex-row">
          <div>
            <div className="flex flex-col">
              <span className="text-scale-1200 group-hover:text-brand-900 text-left text-base transition">
                {props.title}
              </span>
              <p className="text-scale-1100 text-left text-sm transition">{props.description}</p>
            </div>
          </div>
        </div>
      </a>
    </Link>
  )
}

export default ArticleButtonListItem

import { NewspaperIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import { Article } from '../types'

const ArticleButtonListItem = (props: Article) => {
  return (
    <Link href={props.url}>
      <div className="group mr-2 mb-2 cursor-pointer">
        <div className="flex flex-row">
          <div>
            <div className="flex flex-col">
              <span className="text-scale-1200 group-hover:text-brand-900 text-left text-base transition">
                {props.title}
              </span>
              <span className="text-scale-1100 text-sm transition">{props.description}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ArticleButtonListItem

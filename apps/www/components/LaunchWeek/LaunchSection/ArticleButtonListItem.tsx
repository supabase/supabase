import { NewspaperIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import { Article } from '../types'

const ArticleButtonListItem = (props: Article) => {
  return (
    <Link href={props.url}>
      <div className="group mr-2 mb-2 inline-block">
        <button
          className="
          
          text-scale-1200 
          flex items-start gap-3 
          
          transition"
        >
          <div className="w-10">
            <NewspaperIcon strokeWidth={1} />
          </div>
          <div className="flex flex-col items-start gap-0">
            <span className="group-hover:text-brand-900 text-xl transition">{props.title}</span>
            <span className="text-scale-1100 text-sm transition">{props.description}</span>
          </div>
        </button>
      </div>
    </Link>
  )
}

export default ArticleButtonListItem

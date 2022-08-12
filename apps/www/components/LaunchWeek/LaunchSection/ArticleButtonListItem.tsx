import { NewspaperIcon } from '@heroicons/react/outline'
import { Article } from '../types'

const ArticleButtonListItem = (props: Article) => {
  return (
    <div className="mr-2 mb-2 inline-block">
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
          <span className="text-xl">{props.title}</span>
          <span className="text-scale-1100 text-sm">{props.description}</span>
        </div>
      </button>
    </div>
  )
}

export default ArticleButtonListItem

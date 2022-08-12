import { NewspaperIcon } from '@heroicons/react/outline'
import { Article } from '../types'

const ArticleButton = (props: Article) => {
  return (
    <div className="mr-2 mb-2 inline-block">
      <button
        className="
            bg-scale-100
            dark:bg-scale-300 text-scale-1200 
            hover:bg-scale-200 
            dark:hover:bg-scale-400 border-scale-500 
            flex items-start gap-3 rounded-md 
            border p-3 
            px-6 drop-shadow-sm transition"
      >
        <div className="w-6">
          <NewspaperIcon strokeWidth={1} />
        </div>
        <div className="flex flex-col items-start gap-0">
          <span className="text-base">{props.title}</span>
          <span className="text-scale-1100 text-sm">{props.description}</span>
        </div>
      </button>
    </div>
  )
}

export default ArticleButton

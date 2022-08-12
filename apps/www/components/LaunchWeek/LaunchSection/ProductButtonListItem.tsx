import { SparklesIcon } from '@heroicons/react/outline'
import { Article } from '../types'

export const ProductButtonListItem = (props: Article) => {
  return (
    <div className="inline-block">
      <button
        className=" 
                text-brand-1200
                flex items-start gap-3 bg-transparent
                transition
                dark:drop-shadow-sm"
      >
        <div className="w-6">
          <SparklesIcon strokeWidth={1} />
        </div>
        <div className="flex flex-col items-start gap-0">
          <span className="text-base">{props.title}</span>
          <span className="text-scale-900 text-sm">{props.description}</span>
        </div>
      </button>
    </div>
  )
}

export default ProductButtonListItem

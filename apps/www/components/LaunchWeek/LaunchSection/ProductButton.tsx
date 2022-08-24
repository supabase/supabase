import { SparklesIcon } from '@heroicons/react/outline'
import { Article } from '../types'

const ProductButton = (props: Article) => {
  return (
    <div className="mr-2 mb-2 inline-block">
      <button
        className=" 
                text-brand-1200
                hover:bg-scale-300 border-scale-500 flex items-start gap-3 rounded-md border bg-transparent p-3 
                px-6 transition
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

export default ProductButton

import { SparklesIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import { Article } from '../../types'

export const ProductButtonListItem = (props: Article) => {
  return (
    <Link href={props.url}>
      <div className="inline-block">
        <button
          className=" 
          text-brand-600 
          group
          flex items-start gap-3 bg-transparent
          transition
          drop-shadow-sm"
        >
          <div className="w-5">
            <SparklesIcon strokeWidth={1} />
          </div>
          <div className="flex flex-col items-start gap-0">
            <span className="group-hover:text-brand text-sm">{props.title}</span>
            <p className="text-foreground-light text-left text-sm">{props.description}</p>
          </div>
        </button>
      </div>
    </Link>
  )
}

export default ProductButtonListItem

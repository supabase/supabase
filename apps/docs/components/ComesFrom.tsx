import { FC } from 'react'
import { IconSearch } from 'ui'
// [Terry] — delete this after development
// just for making it easy to see where things are coming from
interface Props {
  link: string
  text: string
  className?: string
}
export const ComesFrom: FC<Props> = ({ link, text, className }) => {
  return (
    <div className={`comes-from text-xs flex items-center gap-2 -mb-6 ${className}`}>
      <span className="flex items-center gap-2 p-1 uppercase bg-slate-100 text-slate-600">
        <IconSearch size={14} />
        Comes from:
      </span>
      <a className="no-underline text-slate-600 hover:underline" href={link}>
        {text}
      </a>
    </div>
  )
}

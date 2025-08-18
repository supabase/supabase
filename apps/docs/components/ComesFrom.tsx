import { FC } from 'react'
import { IconSearch } from '~/../../packages/ui'
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
      <span className="uppercase bg-slate-100 p-1 text-slate-600 flex gap-2 items-center">
        <IconSearch size={14} />
        Comes from:
      </span>
      <a className="text-slate-600 no-underline hover:underline" href={link}>
        {text}
      </a>
    </div>
  )
}

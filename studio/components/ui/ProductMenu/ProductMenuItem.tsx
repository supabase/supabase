import { FC, ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  name: string | ReactNode
  isActive: boolean
  icon?: ReactNode
  action?: ReactNode
  url?: string
  target?: '_blank' | '_self'
  onClick?: () => void
  textClassName?: string
}

const ProductMenuItem: FC<Props> = ({
  name = '',
  isActive,
  icon,
  action,
  url = '',
  target = '_self',
  onClick,
  textClassName = '',
}) => {
  const menuItem = (
    <button
      className={`cursor-pointer flex space-x-3 items-center outline-none focus-visible:ring-1 ring-scale-1200 focus-visible:z-10 group px-3 py-1 font-normal border-scale-500 group-hover:border-scale-900 w-full rounded-md ${isActive ? 'bg-scale-400 dark:bg-scale-300' : ''}`}
      onClick={onClick || (() => {})}
    >
      {icon && (
        <span className="transition  text-sm text-scale-900 group-hover:text-scale-1100">
          {icon}
        </span>
      )}
      <span className='transition truncate text-sm w-full text-scale-1100 group-hover:text-scale-1200'>
        <div className="flex w-full items-center justify-between">
          <span
            title={typeof name === 'string' ? name : ''}
            className={'flex items-center truncate ' + textClassName}
          >
            {name}
          </span>
          {action}
        </div>
      </span>
    </button>
  )

  if (url) {
    return (
      <Link href={url}>
        <a className="block" target={target}>
          {menuItem}
        </a>
      </Link>
    )
  }

  return menuItem
}

export default ProductMenuItem

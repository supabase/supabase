import Image from 'next/legacy/image'
import Link from 'next/link'
import { FC } from 'react'

interface Props {
  title: string
  description?: string
  to: string
  icon?: string | any
  children?: any
  layout?: 'vertical' | 'horizontal'
}

const ButtonCard: FC<Props> = ({
  children = undefined,
  icon = undefined,
  title,
  description = '',
  to,
  layout = 'vertical',
}) => {
  return (
    <Link
      href={to}
      className={[
        'h-full block shadow-none bg-scale-300 rounded transition',
        'border border-transparent hover:border-scale-600',
      ].join(' ')}
    >
      {children ? (
        children
      ) : (
        <div
          className={[
            'px-6 py-4 gap-x-4 gap-y-2 flex',
            `${layout === 'vertical' ? 'flex-col' : 'items-center'}`,
          ].join(' ')}
        >
          {icon && typeof icon == 'string' ? (
            <div className="w-[24px] h-[24px]">
              <Image className="m-0" src={icon} width={24} height={24} alt={title} />
            </div>
          ) : (
            icon
          )}
          <h3 className="my-0 text-base text-scale-1200">{title}</h3>
          <p className="my-0 text-sm">{description}</p>
        </div>
      )}
    </Link>
  )
}

export default ButtonCard

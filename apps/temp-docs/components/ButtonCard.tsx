import React from 'react'
import Link from 'next/link'

export default function ButtonCard({
  children = undefined,
  icon = undefined,
  title,
  description = '',
  to,
  layout = 'vertical',
}) {
  return (
    <Link href={to}>
      <a className={['button-card h-full pb-4 block', `button-card--${layout}`].join(' ')}>
        {children ? (
          children
        ) : (
          <div
            className={`button-card__inner p-4 gap-1 flex ${
              layout === 'vertical' ? 'flex-col' : 'items-center'
            }`}
          >
            {icon && typeof icon == 'string' ? (
              <img className="m-0" src={icon} width={24} alt={title} />
            ) : (
              icon
            )}
            <h3 className="mt-0">{title}</h3>
            <p>{description}</p>
          </div>
        )}
      </a>
    </Link>
  )
}

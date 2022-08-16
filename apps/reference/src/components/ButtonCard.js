import React from 'react'
import Link from '@docusaurus/Link'

export default function ButtonCard({
  children,
  color,
  icon,
  title,
  description,
  to,
  layout = 'vertical',
}) {
  return (
    <Link
      to={to}
      className={['button-card', `button-card--${layout}`].join(' ')}
    >
      {children ? (
        children
      ) : (
        <div className="button-card__inner">
          {icon && typeof icon == 'string' ? (
            <img src={icon} width={24} />
          ) : (
            icon
          )}
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      )}
    </Link>
  )
}

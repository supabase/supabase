import React from 'react'
import Link from '@docusaurus/Link'

export default function ButtonCard({
  children,
  color,
  icon,
  title,
  description,
  to,
}) {
  return (
    <Link to={to}>
      <div className="button-card__container">
        <img src={icon} width={24} />
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </Link>
  )
}

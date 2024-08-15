import React from 'react'

import styleHandler from '../../lib/theme/styleHandler'
import Typography from '../Typography'

interface CardProps {
  children?: React.ReactNode
  className?: string
  cover?: React.ReactNode
  description?: string
  hoverable?: boolean
  style?: React.CSSProperties
  title?: string
  titleExtra?: React.ReactNode
}

function Card({ children, className, cover, hoverable, style, title, titleExtra }: CardProps) {
  let __styles = styleHandler('card')

  let classes = [__styles.base]
  if (hoverable) classes.push(__styles.hoverable)
  if (className) classes.push(className)

  return (
    <div className={classes.join(' ')} style={style}>
      {title && (
        <div className={__styles.head}>
          <Typography.Text style={{ margin: 0 }}>{title}</Typography.Text>
          <Typography.Link style={{ margin: 0 }}>{titleExtra}</Typography.Link>
        </div>
      )}
      {cover}
      <div className={__styles.content}>{children}</div>
    </div>
  )
}

interface MetaProps {
  title?: string
  description?: string
  style?: React.CSSProperties
  className?: string
}

function Meta({ title, description, style, className }: MetaProps) {
  return (
    <div style={style} className={className}>
      <Typography.Title style={{ margin: '0' }} level={5}>
        {title}
      </Typography.Title>
      <div>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </div>
    </div>
  )
}

Card.Meta = Meta
export default Card

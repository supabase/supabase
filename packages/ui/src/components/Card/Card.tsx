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

/**
 * A card component for displaying content in a structured layout.
 * @param {object} props - The component props.
 * @param {React.ReactNode} [props.children] - The content of the card.
 * @param {string} [props.className] - Additional CSS class names.
 * @param {React.ReactNode} [props.cover] - An image or media to be displayed at the top of the card.
 * @param {boolean} [props.hoverable] - If `true`, the card will have a hover effect.
 * @param {React.CSSProperties} [props.style] - Inline CSS styles.
 * @param {string} [props.title] - The title of the card.
 * @param {React.ReactNode} [props.titleExtra] - Extra content to be displayed in the card's header, typically on the right side.
 * @returns {React.ReactElement} The card component.
 */
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

/**
 * A metadata section for a Card component, typically used for displaying a title and description.
 * @param {object} props - The component props.
 * @param {string} [props.title] - The title of the metadata.
 * @param {string} [props.description] - The description of the metadata.
 * @param {React.CSSProperties} [props.style] - Inline CSS styles.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {React.ReactElement} The card metadata component.
 */
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

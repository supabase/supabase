import React from 'react'
import styleHandler from '../../lib/theme/styleHandler'

interface Props {
  children?: React.ReactNode
  target?: '_blank' | '_self' | '_parent' | '_top' | 'framename'
  href?: string
  className?: string
  style?: React.CSSProperties
  onClick?: any
}

function Link({ children, target = '_blank', href, className, onClick, style }: Props) {
  const __styles = styleHandler('link');
  const classes = [className, __styles.base];

  return (
    <a
      onClick={onClick}
      className={classes.join(' ')}
      href={href}
      target={target}
      rel="noopener noreferrer"
      style={style}
    >
      {children}
    </a>
  )
}

export default Link

import React from 'react'
import { Icon } from '../Icon/IconImportHandler'
import { IconUser } from '../Icon/icons/IconUser'
import AvatarStyles from './Avatar.module.css'

export interface AvatarProps {
  children?: React.ReactNode
  src?: string | undefined
  style?: React.CSSProperties
  className?: string
  alt?: string
  text?: string
  AvatarIcon?: Icon
  size: number
}

export default function Avatar({
  src,
  style,
  className,
  alt,
  text,
  AvatarIcon,
  size,
  children,
}: AvatarProps) {
  const classes = [AvatarStyles['sbui-avatar']]
  classes.push(className)
  let objectToRender

  const imageExist = () => {
    const img = new Image()
    img.src = src
    if (img.complete) {
      return true
    } else {
      img.onload = () => {
        return true
      }
      img.onerror = () => {
        return false
      }
    }
  }

  if (imageExist && src) {
    classes.push(AvatarStyles['sbui-avatar-image'])
    objectToRender = (
      <img
        className={classes.join(' ')}
        src={src}
        alt={alt}
        style={{ height: size, width: size, ...style }}
      />
    )
  } else if (AvatarIcon) {
    classes.push(AvatarStyles['sbui-avatar-icon'])
    objectToRender = (
      <div className={classes.join(' ')} style={{ height: size, width: size, ...style }}>
        <AvatarIcon />
      </div>
    )
  } else if (text) {
    classes.push(AvatarStyles['sbui-avatar-text'])
    objectToRender = (
      <div className={classes.join(' ')} style={{ height: size, width: size, ...style }}>
        <p>{text[0]}</p>
      </div>
    )
  } else if (children) {
    classes.push(AvatarStyles['sbui-avatar-children'])
    objectToRender = (
      <div className={classes.join(' ')} style={{ height: size, width: size, ...style }}>
        {children}
      </div>
    )
  } else {
    classes.push(AvatarStyles['sbui-avatar-fallback'])
    objectToRender = (
      <div className={classes.join(' ')} style={{ height: size, width: size, ...style }}>
        <IconUser />
      </div>
    )
  }

  return <>{objectToRender}</>
}

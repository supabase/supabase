import React from 'react'
import styleHandler from '../../lib/theme/styleHandler'
// @ts-ignore
import TextStyles from './Text.module.css'

export interface Props {
  className?: string
  children: any
  style?: React.CSSProperties
  type?: 'default' | 'secondary' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  mark?: boolean
  code?: boolean
  keyboard?: boolean
  underline?: boolean
  strikethrough?: boolean
  strong?: boolean
  small?: boolean
}

function Text({
  className,
  children,
  style,
  type,
  disabled,
  mark,
  code,
  keyboard,
  underline,
  strikethrough,
  strong,
  small,
}: Props) {
  const __styles = styleHandler('text')
  const classes = [__styles.base, TextStyles['sbui-typography-text'], className];

  if (disabled) {
    classes.push(__styles.style.disabled);
  }

  if (underline) {
    classes.push(__styles.style.underline);
  }

  if (strikethrough) {
    classes.push(__styles.style.strikethrough);
  }

  if (small) {
    classes.push(__styles.size.small);
  }

  if (type) {
    classes.push(__styles.color[type]);
  }

  if (code) {
    return (
      <code style={style} className={classes.join(' ')}>
        {children}
      </code>
    );
  }

  if (mark) {
    return (
      <mark style={style} className={classes.join(' ')}>
        {children}
      </mark>
    );
  }

  if (keyboard) {
    return (
      <kbd style={style} className={classes.join(' ')}>
        {children}
      </kbd>
    );
  }

  if (strong) {
    return (
      <strong style={style} className={classes.join(' ')}>
        {children}
      </strong>
    );
  }

  return (
    <span style={style} className={classes.join(' ')}>
      {children}
    </span>
  );
}

export default Text;

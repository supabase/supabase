import type { ComponentPropsWithoutRef, CSSProperties } from 'react'

type ImageProps = Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'alt'> & {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export default function Image({
  fill,
  sizes: _sizes,
  priority: _priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  style,
  ...rest
}: ImageProps) {
  const finalStyle: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : style
  return <img {...rest} style={finalStyle} />
}

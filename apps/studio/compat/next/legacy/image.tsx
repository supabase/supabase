import type { ComponentPropsWithoutRef, CSSProperties } from 'react'

type Layout = 'fill' | 'fixed' | 'intrinsic' | 'responsive'
type ObjectFit = CSSProperties['objectFit']

type ImageProps = Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'alt'> & {
  src: string
  alt: string
  layout?: Layout
  objectFit?: ObjectFit
  objectPosition?: CSSProperties['objectPosition']
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
}

export default function Image({
  layout,
  objectFit,
  objectPosition,
  priority: _priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  sizes: _sizes,
  style,
  ...rest
}: ImageProps) {
  const layoutStyle: CSSProperties | undefined =
    layout === 'fill'
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
      : layout === 'responsive'
        ? { width: '100%', height: 'auto' }
        : undefined

  const finalStyle: CSSProperties | undefined =
    layoutStyle || objectFit || objectPosition || style
      ? { ...layoutStyle, objectFit, objectPosition, ...style }
      : undefined

  return <img {...rest} style={finalStyle} />
}

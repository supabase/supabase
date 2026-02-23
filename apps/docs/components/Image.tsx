'use client'

import { useTheme } from 'next-themes'
import NextImage, { ImageProps as NextImageProps } from 'next/image'

interface StaticImageData {
  src: string
  height: number
  width: number
  blurDataURL?: string
  blurWidth?: number
  blurHeight?: number
}

interface StaticRequire {
  default: StaticImageData
}
type StaticImport = StaticRequire | StaticImageData

type SourceType =
  | string
  | {
      dark: string | StaticImport
      light: string | StaticImport
    }

export interface ImageProps extends Omit<NextImageProps, 'src'> {
  src: SourceType
  caption?: string
  containerClassName?: string
}

/**
 *
 * This is a shrunk version of the `ui` package Image component. Because of
 * Cumulative Layout Shift caused by problems stated in this PR
 * https://github.com/supabase/supabase/pull/43026/ that's affecting hash
 * navigation, and the need to support captions and light/dark image versions.
 *
 * Ideally we should solve these issues in that component and re-use it again,
 * making sure it doesn't affect other projects consuming the component.
 *
 */
const Image = ({ src, alt = '', ...props }: ImageProps) => {
  const { resolvedTheme } = useTheme()
  const source =
    typeof src === 'string' ? src : resolvedTheme?.includes('dark') ? src.dark : src.light

  return (
    <figure className={props.containerClassName}>
      <NextImage
        key={resolvedTheme}
        alt={alt}
        src={source}
        className={props.className}
        style={props.style}
        {...props}
      />
      {props.caption && <figcaption className="text-center">{props.caption}</figcaption>}
    </figure>
  )
}

export default Image

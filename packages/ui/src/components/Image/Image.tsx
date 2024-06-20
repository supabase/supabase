import 'react-medium-image-zoom/dist/styles.css'

import React, { useEffect, useState } from 'react'
import NextImage, { type ImageProps as NextImageProps } from 'next/image'
import { useTheme } from 'next-themes'
import { useBreakpoint } from 'common'
import { cn } from '../../lib/utils'
import Zoom from 'react-medium-image-zoom'
import ZoomContent from './ZoomContent'

type SourceType =
  | string
  | {
      dark: string
      light: string
    }

type CaptionAlign = 'left' | 'center' | 'right'

interface Props {
  src: SourceType
  style?: React.CSSProperties
  className?: string
  containerClassName?: string
  alt?: string
  zoomable?: boolean
  caption?: string
  captionAlign?: CaptionAlign
}

export type ImageProps = Props & NextImageProps

/**
 * An advanced Image component that extended next/image.
 * - It accepts all the next/image props
 * - 'src' prop can either be a simple string or an object that specifies theme alternatives {dark: string, light: string}
 * - optional "zoomable" {boolean} prop to make the image zoomable on click
 * - optional "caption" {string} to add a figcaption
 * - optional "captionAlign" {'left' | 'center' | 'right'} to align the caption
 */
const Image = ({ src, alt = '', zoomable, ...props }: ImageProps) => {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const isMobile = useBreakpoint()
  const Component = zoomable ? Zoom : 'span'
  const sizes = zoomable
    ? '(max-width: 768px) 200vw, (max-width: 1200px) 120vw, 200vw'
    : '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 100vw'
  const source =
    typeof src === 'string' ? src : resolvedTheme?.includes('dark') ? src.dark : src.light

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <figure className={cn('next-image--dynamic-fill', props.containerClassName)}>
      <Component
        {...(zoomable ? { ZoomContent: ZoomContent, zoomMargin: isMobile ? 20 : 80 } : undefined)}
      >
        <NextImage
          alt={alt}
          src={source}
          sizes={sizes}
          className={props.className}
          style={props.style}
          {...props}
        />
      </Component>
      {props.caption && (
        <figcaption className={cn(getCaptionAlign(props.captionAlign))}>{props.caption}</figcaption>
      )}
    </figure>
  )
}

const getCaptionAlign = (align?: CaptionAlign) => {
  switch (align) {
    case 'left':
      return 'text-left'
    case 'right':
      return 'text-right'
    case 'center':
    default:
      return 'text-center'
  }
}

export default Image

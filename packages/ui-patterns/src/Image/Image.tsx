'use client'

import 'react-medium-image-zoom/dist/styles.css'

import { FrameworkImage, useBreakpoint, type FrameworkImageProps, type StaticImport } from 'common'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Zoom from 'react-medium-image-zoom'
import { cn } from 'ui'

import ZoomContent from './ZoomContent'

export type CaptionAlign = 'left' | 'center' | 'right'

export type SourceType =
  | string
  | {
      dark: string | StaticImport
      light: string | StaticImport
    }

export interface ImageProps extends Omit<FrameworkImageProps, 'src'> {
  src: SourceType
  zoomable?: boolean
  caption?: string
  captionAlign?: CaptionAlign
  containerClassName?: string
}

/**
 * An advanced Image component that extends FrameworkImage with:
 * - src: prop can either be a string or an object with theme alternatives {dark: string, light: string}
 * - zoomable: {boolean} (optional) to make the image zoomable on click
 * - caption: {string} (optional) to add a figcaption
 * - captionAlign: {'left' | 'center' | 'right'} (optional) to align the caption
 * - containerClassName: {string} (optional) to style the parent <figure> container
 */
export const Image = ({
  src,
  alt = '',
  zoomable,
  caption,
  captionAlign,
  containerClassName,
  ...props
}: ImageProps) => {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const isLessThanLgBreakpoint = useBreakpoint()

  const Component = zoomable ? Zoom : 'span'
  const sizes = zoomable
    ? '(max-width: 768px) 200vw, (max-width: 1200px) 120vw, 200vw'
    : '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 33vw'
  const source =
    typeof src === 'string' ? src : resolvedTheme?.includes('dark') ? src.dark : src.light

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <figure className={cn('next-image--dynamic-fill', containerClassName)}>
      <Component
        {...(zoomable
          ? { ZoomContent: ZoomContent, zoomMargin: isLessThanLgBreakpoint ? 20 : 80 }
          : undefined)}
      >
        <FrameworkImage key={resolvedTheme} alt={alt} src={source} sizes={sizes} {...props} />
      </Component>
      {caption && <figcaption className={cn(getCaptionAlign(captionAlign))}>{caption}</figcaption>}
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

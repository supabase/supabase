import { toPng, toSvg } from 'html-to-image'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'

export const useExportSchemaToImage = () => {
  const [isDownloading, setIsDownloading] = useState(false)
  // By doing this once and passing the result to html-to-image options, we avoid html-to-image calculating it for every node.
  // This improves performance a lot. See https://github.com/bubkoo/html-to-image/issues/542#issuecomment-3249408793
  const allPropertyNames = useMemo(() => getAllPropertyNames(), [])

  const exportSchemaToImage = useStaticEffectEvent(
    async ({
      element,
      projectRef,
      x,
      y,
      zoom,
      format,
    }: {
      element: HTMLElement
      projectRef: string
      x: number
      y: number
      zoom: number
      format: 'svg' | 'png'
    }) => {
      setIsDownloading(true)
      const width = element.clientWidth
      const height = element.clientHeight

      const options = {
        includeStyleProperties: allPropertyNames,
        backgroundColor: 'white',
        width,
        height,
        style: {
          width: width.toString(),
          height: height.toString(),
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        },
      }
      try {
        if (format === 'svg') {
          const data = await toSvg(element, options)
          const a = document.createElement('a')
          a.setAttribute('download', `supabase-schema-${projectRef}.svg`)
          a.setAttribute('href', data)
          a.click()
          toast.success('Successfully downloaded as SVG')
        } else if (format === 'png') {
          const data = await toPng(element, options)
          const a = document.createElement('a')
          a.setAttribute('download', `supabase-schema-${projectRef}.png`)
          a.setAttribute('href', data)
          a.click()
          toast.success('Successfully downloaded as PNG')
        }
      } catch (error) {
        console.error('Failed to download:', error)
        toast.error(`Failed to download current view: ${(error as Error).message}`)
      } finally {
        setIsDownloading(false)
      }
    }
  )

  return useMemo(
    () => ({ isDownloading, exportSchemaToImage }),
    [isDownloading, exportSchemaToImage]
  )
}

// Get all property names accessible through getComputedStyle(), excluding custom properties
export const getAllPropertyNames = () => {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return []
  }

  const names = []
  const style = getComputedStyle(document.documentElement)
  for (let i = 0; i < style.length; i++) {
    const name = style[i]
    if (!name.startsWith('--')) {
      names.push(name)
    }
  }
  return names
}

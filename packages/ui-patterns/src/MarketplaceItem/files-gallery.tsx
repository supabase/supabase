'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from 'ui'

type MarketplaceItemGalleryFile = {
  id?: string | number
  name: string
  href?: string
  description?: string
}

const IMAGE_EXTENSIONS = new Set(['avif', 'bmp', 'gif', 'jpg', 'jpeg', 'png', 'svg', 'webp'])

function getFileExtension(fileName: string) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? '' : ''
}

function isImageFile(file: MarketplaceItemGalleryFile) {
  const hrefExtension = file.href ? getFileExtension(file.href.split('?')[0] ?? file.href) : ''
  if (hrefExtension && IMAGE_EXTENSIONS.has(hrefExtension)) return true
  const nameExtension = getFileExtension(file.name)
  return IMAGE_EXTENSIONS.has(nameExtension)
}

function getFallbackExtensionLabel(fileName: string) {
  const extension = getFileExtension(fileName)
  return extension ? extension.toUpperCase() : 'FILE'
}

export function MarketplaceItemFilesGallery({
  files,
  className,
}: {
  files: MarketplaceItemGalleryFile[]
  className?: string
}) {
  const initialActiveIndex = useMemo(() => {
    const firstImageIndex = files.findIndex((file) => isImageFile(file))
    return firstImageIndex >= 0 ? firstImageIndex : 0
  }, [files])

  const [activeIndex, setActiveIndex] = useState(initialActiveIndex)
  useEffect(() => {
    setActiveIndex(initialActiveIndex)
  }, [initialActiveIndex])

  const activeFile = files[activeIndex]
  const activeFileIsImage = activeFile ? isImageFile(activeFile) : false

  if (files.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="overflow-hidden rounded-md border bg-muted">
          <div className="h-56 w-full sm:h-72" />
        </div>

        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`empty-file-placeholder-${index}`}
              className="size-16 shrink-0 rounded-md border bg-muted"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="overflow-hidden rounded-md border bg-muted/20">
        <div className="w-full">
          {activeFileIsImage && activeFile?.href ? (
            <img src={activeFile.href} alt={activeFile.name} className="w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4">
              <span className="text-sm font-medium text-muted-foreground">
                {activeFile ? getFallbackExtensionLabel(activeFile.name) : 'FILE'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {files.map((file, index) => {
          const selected = index === activeIndex
          const fileIsImage = isImageFile(file)

          return (
            <button
              key={file.id ?? `${file.name}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View file ${file.name}`}
              aria-pressed={selected}
              className={cn(
                'relative rounded size-16 shrink-0 overflow-hidden rounded-md border bg-muted/20 transition',
                selected ? 'ring-2 ring-foreground/50' : 'hover:border-foreground/40'
              )}
            >
              {fileIsImage && file.href ? (
                <img src={file.href} alt={file.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {getFallbackExtensionLabel(file.name)}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

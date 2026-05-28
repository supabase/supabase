'use client'

import { FileCode } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from 'ui'

import { getLanguageIconSrc, normalizeCodeLanguage } from './languageIcon'

function CodeLanguageIcon({
  language,
  size = 14,
  className,
}: {
  language: string
  size?: number
  className?: string
}) {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark') ?? true
  const icon = getLanguageIconSrc(language, { isDarkTheme })

  if (!icon) {
    return (
      <FileCode
        size={size}
        strokeWidth={1.75}
        className={cn('shrink-0 text-foreground-muted', className)}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={icon.src}
      alt=""
      width={size}
      height={size}
      className={cn('shrink-0 rounded-sm object-contain', className)}
      aria-hidden
    />
  )
}

export { CodeLanguageIcon, normalizeCodeLanguage }

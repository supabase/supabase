'use client'

import GuidesSidebar from '~/components/GuidesSidebar'
import { cn } from 'ui'
import type { ComponentProps, ReactNode } from 'react'

import { useDocsAiSidebarOptional } from './DocsAiSidebarContext'

export { GuideMobileAiButton } from './GuideMobileAiButton'

function useHideGuideSecondarySidebar() {
  const aiSidebar = useDocsAiSidebarOptional()
  return aiSidebar?.isOpen ?? false
}

function guideArticleColumnClassName(isAiSidebarOpen: boolean, className?: string) {
  return cn(
    'relative transition-all ease-out duration-100',
    'col-span-12 md:col-span-9',
    isAiSidebarOpen && 'max-[1899px]:md:col-span-12',
    className
  )
}

function guideSecondarySidebarClassName(isAiSidebarOpen: boolean, className?: string) {
  return cn(
    'hidden md:flex',
    'col-span-3 self-start',
    'sticky',
    'top-[calc(var(--header-height)+1px+2rem)]',
    'max-h-[calc(100vh-var(--header-height)-3rem)]',
    isAiSidebarOpen && 'max-[1899px]:!hidden min-[1900px]:!flex',
    className
  )
}

function GuideArticleColumn({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const isAiSidebarOpen = useHideGuideSecondarySidebar()

  return (
    <div className={guideArticleColumnClassName(isAiSidebarOpen, className)}>{children}</div>
  )
}

function GuideSecondarySidebar(props: ComponentProps<typeof GuidesSidebar>) {
  const isAiSidebarOpen = useHideGuideSecondarySidebar()

  return (
    <GuidesSidebar
      {...props}
      className={guideSecondarySidebarClassName(isAiSidebarOpen, props.className)}
    />
  )
}

export {
  GuideArticleColumn,
  GuideSecondarySidebar,
  guideArticleColumnClassName,
  guideSecondarySidebarClassName,
  useHideGuideSecondarySidebar,
}

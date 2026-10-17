'use client'

import Link from 'next/link'
import { type CSSProperties, type PropsWithChildren, type ReactNode } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconGitHubSolid,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

interface CodeSampleWrapperProps {
  source: string | URL | (string | URL)[]
}

interface MultipleSourcesProps {
  sources: (string | URL)[]
}

interface SingleSourceProps {
  source: string | URL
}

interface SourceFrameProps {
  footer: ReactNode
  notchWidth?: number
}

export const SOURCE_FOOTER_CLASSES = cn(
  'not-prose absolute right-0 bottom-0 z-1 flex h-8 w-(--source-notch-width) items-center gap-2 px-3 whitespace-nowrap',
  'text-xs text-foreground-lighter no-underline transition-colors hover:text-foreground',
  'focus-inset rounded-md'
)

const DEFAULT_NOTCH_WIDTH = 117

const getNotchOutline = (width: number): string =>
  `M0 39.5A7.5 7.5 0 0 0 7.5 32V16A8.5 8.5 0 0 1 16 7.5H${width}A7.5 7.5 0 0 0 ${width + 7.5} 0`

const getNotchFocusRing = (width: number): string =>
  `M0 41A9 9 0 0 0 9 32V16A7 7 0 0 1 16 9H${width}A9 9 0 0 0 ${width + 9} 0`

const getNotchMask = (width: number): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width + 10}' height='42'><path d='M0 40A8 8 0 0 0 8 32V16A8 8 0 0 1 16 8H${width}A8 8 0 0 0 ${width + 8} 0H${width + 10}V42H0Z'/></svg>`
  )}")`

const getSourcePath = (source: string | URL): string => {
  const [, org, repo, , , ...path] = new URL(source).pathname.split('/')
  return `${org}/${repo}/${path.join('/')}`
}

export function CodeSampleDummy() {
  return (
    <Admonition type="caution" title="Local development warning">
      The <code>$CodeSample</code> directive with external repos is not supported in local
      development because it relies on a GitHub API key. Please check the preview site to see the
      final UI.
    </Admonition>
  )
}

export function CodeSampleWrapper({
  children,
  /**
   * A GitHub URL to the source code file.
   */
  source: _source,
}: PropsWithChildren<CodeSampleWrapperProps>) {
  const source = Array.isArray(_source) ? _source : [_source]

  if (source.length === 1) {
    return <SingleSource source={source[0]}>{children}</SingleSource>
  }

  if (source.length > 1) {
    return <MultipleSources sources={source}>{children}</MultipleSources>
  }

  return <>{children}</>
}

function MultipleSources({ children, sources }: PropsWithChildren<MultipleSourcesProps>) {
  return (
    <SourceFrame
      footer={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button tabIndex={0} className={SOURCE_FOOTER_CLASSES}>
              <IconGitHubSolid size={14} aria-hidden />
              View source
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sources.map((source) => (
              <DropdownMenuItem
                key={source.toString()}
                onSelect={() => window.open(source.toString(), '_blank', 'noopener noreferrer')}
              >
                {getSourcePath(source)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {children}
    </SourceFrame>
  )
}

function SingleSource({ children, source }: PropsWithChildren<SingleSourceProps>) {
  return (
    <SourceFrame
      footer={
        <Link
          href={source.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className={SOURCE_FOOTER_CLASSES}
        >
          <IconGitHubSolid size={14} aria-hidden />
          View source
        </Link>
      }
    >
      {children}
    </SourceFrame>
  )
}

export function SourceFrame({
  children,
  footer,
  notchWidth = DEFAULT_NOTCH_WIDTH,
}: PropsWithChildren<SourceFrameProps>) {
  const outline = getNotchOutline(notchWidth)
  const notchStyle = {
    '--source-notch-width': `${notchWidth}px`,
    '--source-notch-mask': getNotchMask(notchWidth),
    '--source-notch-mask-width': `${notchWidth + 10}px`,
  } as CSSProperties

  return (
    <div
      style={notchStyle}
      className="group/source code-sample-source shiki-wrapper relative w-full [&_.shiki]:pb-8 [&_.shiki]:shadow-none!"
    >
      <div className="codeblock-drop-shadow relative has-[.code-scroll:focus-visible]:z-1">
        {children}
      </div>
      <svg
        aria-hidden
        width={notchWidth + 8}
        height="40"
        viewBox={`0 0 ${notchWidth + 8} 40`}
        fill="none"
        className="pointer-events-none absolute right-0 bottom-0 z-1 overflow-visible"
      >
        <path d={outline} className="stroke-background-200" />
        <path d={outline} className="stroke-border" />
        <path
          d={getNotchFocusRing(notchWidth)}
          strokeWidth={2}
          className="hidden stroke-ring group-has-[.code-scroll:focus-visible]/source:inline"
        />
      </svg>
      {footer}
    </div>
  )
}

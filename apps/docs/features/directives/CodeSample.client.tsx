'use client'

import Link from 'next/link'
import { useState, type PropsWithChildren } from 'react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

export function CodeSampleWrapper({
  children,
  /**
   * A GitHub URL to the source code file.
   */
  source: _source,
}: PropsWithChildren<{ source: string | URL | (string | URL)[] }>) {
  const source = Array.isArray(_source) ? _source : [_source]

  if (source.length === 1) {
    return <SingleSource source={source[0]}>{children}</SingleSource>
  }

  if (source.length > 1) {
    return <MultipleSources sources={source}>{children}</MultipleSources>
  }

  return <>{children}</>
}

function MultipleSources({ children, sources }: PropsWithChildren<{ sources: (string | URL)[] }>) {
  return (
    <>
      {children}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="block -mt-4 mb-4 ml-auto text-foreground-lighter text-sm focus-visible:outline-none focus-visible:underline">
            View sources
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sources.map((source) => (
            <DropdownMenuItem
              key={source.toString()}
              onSelect={() => window.open(source.toString(), '_blank', 'noopener noreferrer')}
            >
              ...{source.toString().split('/').slice(-2).join('/')}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function SingleSource({ children, source }: PropsWithChildren<{ source: string | URL }>) {
  return (
    <>
      {children}
      <Link
        href={source.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="block -mt-4 mb-4 text-right no-underline text-foreground-lighter text-sm"
      >
        View source
      </Link>
    </>
  )
}

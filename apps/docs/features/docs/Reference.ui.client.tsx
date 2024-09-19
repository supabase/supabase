'use client'

import type { HTMLAttributes, PropsWithChildren } from 'react'
import { useContext, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import {
  cn,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { ReferenceContentInitiallyScrolledContext } from '~/features/docs/Reference.navigation.client'
import { type IApiEndPoint } from './Reference.api.utils'
import { API_REFERENCE_REQUEST_BODY_SCHEMA_DATA_ATTRIBUTES } from './Reference.ui.shared'

/**
 * Wrap a reference section with client-side functionality:
 *
 * - Intersection observer to auto-update the URL when the user scrolls the page
 * - An ID to scroll to programmatically. This is on the entire section rather
 *   than the heading to avoid problems with scroll-to position when the heading
 *   is sticky.
 */
export function ReferenceSectionWrapper({
  id,
  link,
  children,
  className,
}: PropsWithChildren<{ id: string; link: string; className?: string }> &
  HTMLAttributes<HTMLElement>) {
  const initialScrollHappened = useContext(ReferenceContentInitiallyScrolledContext)

  const { ref } = useInView({
    threshold: 0,
    rootMargin: '-10% 0% -50% 0%',
    onChange: (inView) => {
      if (
        inView &&
        initialScrollHappened &&
        window.scrollY > 0 /* Don't update on first navigation to introduction */
      ) {
        window.history.replaceState(null, '', link)
      }
    },
  })

  return (
    <section
      ref={ref}
      id={id}
      className={cn('scroll-mt-[calc(var(--header-height)+4rem)]', className)}
    >
      {children}
    </section>
  )
}

export function ApiOperationBodySchemeSelector({
  requestBody,
  className,
}: {
  requestBody: IApiEndPoint['requestBody']
  className?: string
}) {
  const availableSchemes = Object.keys(requestBody.content) as Array<
    'application/json' | 'application/x-www-form-urlencoded'
  >
  const [selectedScheme, setSelectedScheme] = useState(availableSchemes[0])

  const containerRef = useRef<HTMLDivElement>(null)
  const allSchemeDetails = useRef<HTMLUListElement[]>([])
  useEffect(() => {
    allSchemeDetails.current = Array.from(
      containerRef.current?.querySelectorAll(
        `[${API_REFERENCE_REQUEST_BODY_SCHEMA_DATA_ATTRIBUTES.KEY}]`
      )
    )
  }, [])

  useEffect(() => {
    allSchemeDetails.current?.forEach((schemeDetails) => {
      schemeDetails.hidden =
        schemeDetails.getAttribute(API_REFERENCE_REQUEST_BODY_SCHEMA_DATA_ATTRIBUTES.KEY) !==
        selectedScheme
    })
  }, [selectedScheme])

  return (
    <div ref={containerRef} className={cn('flex items-center justify-between gap-2', className)}>
      <h3 className="text-base text-foreground">Body</h3>
      <Select_Shadcn_
        value={selectedScheme}
        onValueChange={(value) =>
          setSelectedScheme(value as 'application/json' | 'application/x-www-form-urlencoded')
        }
      >
        <SelectTrigger_Shadcn_ className="w-48 [&>span]:w-full [&>span]:truncate">
          <SelectValue_Shadcn_ />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          <SelectGroup_Shadcn_>
            {availableSchemes.map((scheme) => (
              <SelectItem_Shadcn_ key={scheme} value={scheme}>
                {scheme}
              </SelectItem_Shadcn_>
            ))}
          </SelectGroup_Shadcn_>
        </SelectContent_Shadcn_>
      </Select_Shadcn_>
    </div>
  )
}

'use client'

import { ChangeEvent, useState } from 'react'
import { MainSkeleton } from '~/layouts/MainSkeleton'
import { useDocsSearch } from './useDocsSearch'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { Input_Shadcn_ } from 'ui'
import { result } from 'lodash'

export default function TestSearchPage() {
  const { searchResults, handleDocsSearchDebounced } = useDocsSearch()

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    console.log('CHANGE:', event.currentTarget.value)
    handleDocsSearchDebounced(event.currentTarget.value)
  }

  return (
    <MainSkeleton>
      <LayoutMainContent>
        <Input_Shadcn_
          type="text"
          placeholder="Search"
          className="w-48 mb-4"
          onChange={handleChange}
        />
        <ul>
          {searchResults.map((result) => (
            <li key={result.id}>
              {result.title}
              {result.headings && (
                <ul className="ml-4">
                  {result.headings.map((heading) => (
                    <li key={heading}>{heading}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </LayoutMainContent>
    </MainSkeleton>
  )
}

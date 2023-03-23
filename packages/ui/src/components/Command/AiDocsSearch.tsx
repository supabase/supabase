import React, { useEffect, useMemo, useReducer } from 'react'
import type { CreateCompletionResponse } from 'openai'
import { FC, useCallback, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// @ts-ignore
import { SSE } from 'sse.js'
// import clippyImageDark from '../../public/img/clippy-dark.png'
// import clippyImage from '../../public/img/clippy.png'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useTheme } from 'common/Providers'
import Image from 'next/image'
import {
  Button,
  IconAlertCircle,
  IconAlertTriangle,
  IconLoader,
  IconSearch,
  IconUser,
  Input,
  Loading,
  Modal,
  Tabs,
} from 'ui'
// import components from '~/components'
// import { IS_PLATFORM } from '~/lib/constants'
// import { SearchContextValue } from './SearchProvider'
import SearchResult, { SearchResultType } from './SearchResult'
import { CommandGroup, CommandItem, CommandInput, CommandLabel } from './Command.utils'
import { IconCopy } from '../Icon/icons/IconCopy'

import { AiIcon, AiIconChat, COMMAND_ROUTES } from './Command'
import { debounce } from 'lodash'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

const RLSquestions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

function getEdgeFunctionUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

  //   if (IS_PLATFORM) {
  if (true) {
    // @ts-ignore
    const [schemeAndProjectId, domain, tld] = supabaseUrl.split('.')
    return `${schemeAndProjectId}.functions.${domain}.${tld}`
  } else {
    return `${supabaseUrl}/functions/v1`
  }
}

const edgeFunctionUrl = getEdgeFunctionUrl()

function promptDataReducer(
  state: any[],
  action: {
    index?: number
    answer?: string | undefined
    status?: string
    query?: string | undefined
    type?: 'remove-last-item' | string
  }
) {
  // console.log('running reducer')
  // console.log('what is currently in', ...state)
  // console.log('what is the action payload', action)
  // set a standard state to use later
  let current = [...state]

  console.log(action)

  if (action.type) {
    switch (action.type) {
      case 'remove-last-item':
        console.log('removing last item')
        current.pop()
        return [...current]
        break

      default:
        break
    }
  }

  // check that an index is present
  if (action.index === undefined) return [...state]

  if (!current[action.index]) {
    current[action.index] = { query: '', answer: '', status: '' }
  }

  // if (action.answer !== undefined) {
  current[action.index].answer = action.answer
  // }
  if (action.query) {
    current[action.index].query = action.query
  }
  if (action.status) {
    current[action.index].status = action.status
  }

  // console.log('what i will update with', current)
  console.log(current)
  return [...current]

  throw Error('Unknown action.')
}

interface IAiDocsSeach {
  query?: string
  setQuery?: () => void
  page?: string
  isLoading?: boolean
  setIsLoading?: () => void
}

const AiDocsSeach: FC<IAiDocsSeach> = ({ query, setQuery, page, isLoading, setIsLoading }) => {
  const { isDarkMode } = useTheme()

  // const { close, query, setQuery } = useSearch()
  const [answer, setAnswer] = useState<string | undefined>('')
  const [results, setResults] = useState<any[]>()
  const [isResponding, setIsResponding] = useState(false)
  const [hasClippyError, setHasClippyError] = useState(false)
  const [hasSearchError, setHasSearchError] = useState(false)
  const [selectedTab, setSelectedTab] = useState('clippy-panel')
  const eventSourceRef = useRef<SSE>()
  const supabaseClient = useSupabaseClient()

  const [promptIndex, setPromptIndex] = useState(0)
  const [promptData, dispatchPromptData] = useReducer(promptDataReducer, [])

  const cantHelp = answer?.trim() === "Sorry, I don't know how to help with that."
  const status = isLoading
    ? 'Clippy is searching...'
    : isResponding
    ? 'Clippy is responding...'
    : cantHelp || hasClippyError
    ? 'Clippy has failed you'
    : undefined

  const handleSearchConfirm = useCallback(
    async (query: string) => {
      console.log('query', query)
      // console.log('query', query)

      setResults(undefined)
      setAnswer(undefined)
      setIsResponding(false)
      setHasClippyError(false)
      setHasSearchError(false)
      setIsLoading(true)

      const { error, data: pageSections } = await supabaseClient.functions.invoke('search', {
        body: { query: query },
      })

      setIsLoading(false)

      if (error) {
        setIsLoading(false)
        setIsResponding(false)
        setHasSearchError(true)
        console.error(error)
        return
      }

      if (!Array.isArray(pageSections)) {
        setIsLoading(false)
        setIsResponding(false)
        setHasSearchError(true)
        console.error('Malformed response')
        return
      }

      setResults(pageSections)
    },
    [supabaseClient]
  )

  // console.log('current index', promptIndex)

  function handleResetPrompt() {
    eventSourceRef.current?.close()
    eventSourceRef.current = undefined
    setQuery('')
    setResults(undefined)
    setAnswer(undefined)
    setIsResponding(false)
    setHasClippyError(false)
    setHasSearchError(false)
  }

  // console.log(promptData)

  const debounceFn = useMemo(() => debounce(handleSearchConfirm, 1000), [])

  useEffect(() => {
    // if (query) {
    //   handleSearchConfirm(query)
    // }
    if (query) {
      debounceFn(query)
    }
  }, [query])

  return (
    <>
      {results &&
        results.length > 0 &&
        results.map((page, i) => {
          const pageSections = page.sections.filter((section) => !!section.heading)
          return (
            <CommandGroup
              heading=""
              forceMount
              key={`${page.meta.title}-group-index-${i}`}
              value={`${page.meta.title}-group-index-${i}`}
            >
              <CommandItem
                forceMount
                key={`${page.meta.title}-item-index-${i}`}
                value={`${page.meta.title}-item-index-${i}`}
              >
                <CommandLabel>{page.meta.title}</CommandLabel>
                <div>{page.meta.description}</div>
              </CommandItem>
              {pageSections.length > 0 &&
                pageSections.map((section, i) => (
                  //       <SearchResult
                  //         key={section.id}
                  //         href={`${page.path}${page.type === 'reference' ? '/' : '#'}${
                  //           section.slug
                  //         }`}
                  //         type={SearchResultType.Section}
                  //         title={section.heading}
                  //         chip={page.meta.title}
                  //       />
                  <CommandItem
                    forceMount
                    className="ml-8"
                    key={`${section.heading}-item-index-${i}`}
                    value={`${section.heading}-item-index-${i}`}
                  >
                    <CommandLabel>{section.heading}</CommandLabel>
                  </CommandItem>
                ))}
            </CommandGroup>
          )
        })}
      {isLoading && (
        <div className="p-6 grid gap-6 my-4">
          {/* <Loading active>{}</Loading> */}
          <p className="text-lg text-scale-900 text-center">Searching for results</p>
        </div>
      )}
      {results && results.length === 0 && (
        <div className="p-6 flex flex-col items-center gap-6 mt-4">
          <IconAlertTriangle strokeWidth={1.5} size={40} />
          <p className="text-lg text-center">No results found.</p>
          <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
            Try again?
          </Button>
        </div>
      )}
      {hasSearchError && (
        <div className="p-6 flex flex-col items-center gap-6 mt-4">
          <IconAlertTriangle strokeWidth={1.5} size={40} />
          <p className="text-lg text-center">
            Sorry, looks like we&apos;re having some issues with search!
          </p>
          <p className="text-sm text-center">Please try again in a bit.</p>
          <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
            Try again?
          </Button>
        </div>
      )}

      {/* <Tabs.Panel id="clippy-panel" label="Ask Clippy"> */}
      {/* {!isLoading && !answer && !hasClippyError && (
          <div className="">
            <div className="mt-2">
              <h2 className="text-sm text-scale-1100">Not sure where to start?</h2>

              <ul className="text-sm mt-4 text-scale-1100 grid md:flex gap-4 flex-wrap max-w-3xl">
                {questions.map((question) => {
                  const key = question.replace(/\s+/g, '_')
                  return (
                    <li key={key}>
                      <button
                        className="hover:bg-slate-400 hover:dark:bg-slate-400 px-4 py-2 bg-slate-300 dark:bg-slate-200 rounded-lg transition-colors"
                        onClick={() => {
                          setQuery(question)
                          handleClippyConfirm(question)
                        }}
                      >
                        {question}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )} */}

      {hasClippyError && (
        <div className="p-6 flex flex-col items-center gap-6 mt-4">
          <IconAlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
          <p className="text-lg text-scale-1200 text-center">
            Sorry, looks like Clippy is having a hard time!
          </p>
          <p className="text-sm text-scale-900 text-center">Please try again in a bit.</p>
          {/* <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
              Try again?
            </Button> */}
        </div>
      )}
      <div className="absolute right-0 top-0 mt-3 mr-4 hidden md:block"></div>

      <div className="absolute bottom-0 w-full">
        <div className="text-scale-1100 px-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-centerp gap-1 py-2 text-scale-800">
              <span>Powered by OpenAI.</span>
            </div>
            <div className="flex items-center gap-6 py-1">
              {status ? (
                <span className="bg-scale-400 rounded-lg py-1 px-2 items-center gap-2 hidden md:flex">
                  {(isLoading || isResponding) && <IconLoader size={14} className="animate-spin" />}
                  {status}
                </span>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export { AiDocsSeach }

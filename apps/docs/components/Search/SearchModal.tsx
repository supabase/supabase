import type { CreateCompletionResponse } from 'openai'
import { FC, useCallback, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SSE } from 'sse.js'
import clippyImageDark from '../../public/img/clippy-dark.png'
import clippyImage from '../../public/img/clippy.png'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useTheme } from 'common/Providers'
import Image from 'next/image'
import {
  Button,
  IconAlertCircle,
  IconAlertTriangle,
  IconLoader,
  IconSearch,
  Input,
  Loading,
  Modal,
  Tabs,
} from 'ui'
import components from '~/components'
import { IS_PLATFORM } from '~/lib/constants'
import { useSearch } from './SearchProvider'
import SearchResult, { SearchResultType } from './SearchResult'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

function getEdgeFunctionUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

  if (IS_PLATFORM) {
    const [schemeAndProjectId, domain, tld] = supabaseUrl.split('.')
    return `${schemeAndProjectId}.functions.${domain}.${tld}`
  } else {
    return `${supabaseUrl}/functions/v1`
  }
}

const edgeFunctionUrl = getEdgeFunctionUrl()

const SearchModal: FC = () => {
  const { isDarkMode } = useTheme()
  const { close, query, setQuery } = useSearch()
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState<any[]>()
  const [isLoading, setIsLoading] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [hasClippyError, setHasClippyError] = useState(false)
  const [hasSearchError, setHasSearchError] = useState(false)
  const [selectedTab, setSelectedTab] = useState('search-panel')
  const eventSourceRef = useRef<SSE>()
  const supabaseClient = useSupabaseClient()

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
      setResults(undefined)
      setAnswer(undefined)
      setIsResponding(false)
      setHasClippyError(false)
      setHasSearchError(false)
      setIsLoading(true)

      const { error, data: pageSections } = await supabaseClient.functions.invoke('search', {
        body: { query },
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

  const handleClippyConfirm = useCallback(async (query: string) => {
    setResults(undefined)
    setAnswer(undefined)
    setIsResponding(false)
    setHasClippyError(false)
    setHasSearchError(false)
    setIsLoading(true)

    const eventSource = new SSE(`${edgeFunctionUrl}/clippy-search`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({ query }),
    })

    function handleError<T>(err: T) {
      setIsLoading(false)
      setIsResponding(false)
      setHasClippyError(true)
      console.error(err)
    }

    eventSource.addEventListener('error', handleError)
    eventSource.addEventListener('message', (e) => {
      try {
        setIsLoading(false)

        if (e.data === '[DONE]') {
          setIsResponding(false)
          return
        }

        setIsResponding(true)

        const completionResponse: CreateCompletionResponse = JSON.parse(e.data)
        const [{ text }] = completionResponse.choices

        setAnswer((answer) => {
          return (answer ?? '') + text
        })
      } catch (err) {
        handleError(err)
      }
    })

    eventSource.stream()

    eventSourceRef.current = eventSource

    setIsLoading(true)
  }, [])

  const handleConfirm = useCallback(
    (selectedTab: string, query: string) => {
      switch (selectedTab) {
        case 'search-panel':
          return handleSearchConfirm(query)
        case 'clippy-panel':
          return handleClippyConfirm(query)
      }
    },
    [handleSearchConfirm, handleClippyConfirm]
  )

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
  return (
    <Modal size="xlarge" visible={true} onCancel={close} closable={false} hideFooter>
      <div
        className={`mx-auto max-h-[90vh] lg:max-h-[75vh] flex flex-col gap-4 rounded-lg p-4 md:pt-6 md:px-6 pb-2 w-full shadow-2xl overflow-hidden border text-left border-scale-500 bg-scale-100 dark:bg-scale-300 cursor-auto relative min-w-[340px]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Input
            className="w-full"
            size="xlarge"
            autoFocus
            placeholder={selectedTab === 'search-panel' ? 'Search documentation' : 'Ask a question'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<IconSearch size="small" />}
            onKeyDown={(e) => {
              switch (e.key) {
                case 'Enter':
                  if (!query) {
                    return
                  }
                  handleConfirm(selectedTab, query)
                  return
                default:
                  return
              }
            }}
          />
          <div className="absolute right-0 top-0 mt-3 mr-4 hidden md:block">
            <Button type="default" size="tiny" onClick={close}>
              esc
            </Button>
          </div>
          {!isLoading && answer && (
            <div className="absolute right-0 top-0 mt-3 mr-16 hidden md:block">
              <Button type="text" size="tiny" onClick={handleResetPrompt}>
                Try again
              </Button>
            </div>
          )}
        </div>
        <Tabs
          activeId={selectedTab}
          onChange={(tabId) => {
            setSelectedTab(tabId)
            if (!query) {
              handleResetPrompt()
              return
            }
            handleConfirm(tabId, query)
          }}
        >
          <Tabs.Panel id="search-panel" label="Guides & Reference">
            <div className="mb-6">
              {!isLoading && !hasSearchError && !results && (
                <div className="p-10 grid">
                  <h2 className="text-lg text-center text-scale-1100">
                    Search Supabase guides & reference docs
                  </h2>
                </div>
              )}
              {results && results.length > 0 && (
                <div className="flex flex-col gap-3 max-h-[70vh] lg:max-h-[50vh] overflow-y-auto px-4 py-4 rounded-lg bg-scale-200">
                  {results.map((page) => {
                    const pageSections = page.sections.filter((section) => !!section.heading)
                    return (
                      <div key={page.id} className="flex flex-col gap-3">
                        <SearchResult
                          href={page.path}
                          type={SearchResultType.Document}
                          title={page.meta.title}
                        />
                        {pageSections.length > 0 && (
                          <div className="flex flex-row">
                            <div className="border bg-scale-300 rounded-xl self-stretch p-[1px] ml-4 mr-4"></div>
                            <div className="flex flex-col gap-3 items-stretch grow">
                              {pageSections.map((section) => (
                                <SearchResult
                                  key={section.id}
                                  href={`${page.path}${page.type === 'reference' ? '/' : '#'}${
                                    section.slug
                                  }`}
                                  type={SearchResultType.Section}
                                  title={section.heading}
                                  chip={page.meta.title}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {isLoading && (
                <div className="p-6 grid gap-6 mt-4">
                  <Loading active>{}</Loading>
                  <p className="text-lg text-center">Searching for results</p>
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
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="clippy-panel" label="Ask Clippy">
            {!isLoading && !answer && !hasClippyError && (
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
            )}
            {answer && (
              <div className="px-4 py-4 rounded-lg overflow-y-auto bg-scale-200 max-h-[70vh] lg:max-h-[50vh]">
                {cantHelp ? (
                  <p className="flex flex-col gap-4 items-center p-4">
                    <div className="grid md:flex items-center gap-2 mt-4 text-center justify-items-center">
                      <IconAlertCircle />
                      <p>Sorry, I don&apos;t know how to help with that.</p>
                    </div>
                    <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
                      Try again?
                    </Button>
                  </p>
                ) : (
                  <div className="prose dark:prose-dark">
                    <ReactMarkdown
                      linkTarget="_blank"
                      remarkPlugins={[remarkGfm]}
                      transformLinkUri={(href) => {
                        const supabaseUrl = new URL('https://supabase.com')
                        const linkUrl = new URL(href, 'https://supabase.com')

                        if (linkUrl.origin === supabaseUrl.origin) {
                          return linkUrl.toString()
                        }

                        return href
                      }}
                      components={components}
                    >
                      {answer}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
            {isLoading && (
              <div className="p-6 grid gap-6 mt-4">
                <Loading active>{}</Loading>
                <p className="text-lg text-center">Searching for results</p>
              </div>
            )}
            {hasClippyError && (
              <div className="p-6 flex flex-col items-center gap-6 mt-4">
                <IconAlertTriangle strokeWidth={1.5} size={40} />
                <p className="text-lg text-center">
                  Sorry, looks like Clippy is having a hard time!
                </p>
                <p className="text-sm text-center">Please try again in a bit.</p>
                <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
                  Try again?
                </Button>
              </div>
            )}
            <div className="border-t border-scale-600 mt-4 text-scale-1100">
              <div className="flex justify-between items-center py-2 text-xs">
                <div className="flex items-centerp gap-1 pt-3 pb-1">
                  <span>Powered by OpenAI.</span>
                  <a href="/blog/chatgpt-supabase-docs" className="underline">
                    Read the blog post
                  </a>
                </div>
                <div className="flex items-center gap-6 py-1">
                  {status ? (
                    <span className="bg-scale-400 rounded-lg py-1 px-2 items-center gap-2 hidden md:flex">
                      {(isLoading || isResponding) && (
                        <IconLoader size={14} className="animate-spin" />
                      )}
                      {status}
                    </span>
                  ) : (
                    <></>
                  )}
                  <Image
                    width={30}
                    height={34}
                    src={isDarkMode ? clippyImageDark : clippyImage}
                    alt="Clippy"
                  />
                </div>
              </div>
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </Modal>
  )
}

export default SearchModal

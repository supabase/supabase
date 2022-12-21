import { useState, useCallback, useRef, createContext, useContext, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { DocSearchModal } from '@docsearch/react'
import clsx from 'clsx'
import { useActionKey } from '~/hooks/useActionKey'

// [Joshen] We're currently using this over Algolia search for the time being
// Refer to the comment in Navigation/AlgoliaSearch for more information about this

const INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME
const API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID

const SearchContext = createContext(null)

export function SearchProvider({ children }: any) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState(null)
  const onOpen = useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const onInput = useCallback(
    (e) => {
      setIsOpen(true)
      setInitialQuery(e.key)
    },
    [setIsOpen, setInitialQuery]
  )

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen,
    onClose,
    // @ts-ignore
    onInput,
  })

  return (
    <>
      <Head>
        <link rel="preconnect" href={`https://${APP_ID}-dsn.algolia.net`} crossOrigin="true" />
      </Head>
      <SearchContext.Provider
        // @ts-ignore
        value={{
          isOpen,
          onOpen,
          onClose,
          onInput,
        }}
      >
        {children}
      </SearchContext.Provider>
      {isOpen &&
        createPortal(
          <DocSearchModal
            // @ts-ignore
            initialQuery={initialQuery}
            initialScrollY={window.scrollY}
            placeholder="Search documentation"
            onClose={onClose}
            indexName={INDEX_NAME}
            apiKey={API_KEY}
            appId={APP_ID}
            // @ts-ignore
            navigator={{
              navigate({ itemUrl }) {
                setIsOpen(false)
                router.push(itemUrl)
              },
            }}
            getMissingResultsUrl={({ query }) => {
              return `https://github.com/supabase/supabase/issues/new?title=Unable+to+search+docs+with+query:+${query}`
            }}
            hitComponent={Hit}
            transformItems={(items) => {
              return items.map((item, index) => {
                // console.log('item', item)
                // We transform the absolute URL into a relative URL to
                // leverage Next's preloading.
                const a = document.createElement('a')
                a.href = item.url

                const hash = a.hash === '#content-wrapper' ? '' : a.hash

                return {
                  ...item,
                  url: `${a.pathname}${hash}`,
                  __is_result: () => true,
                  __is_parent: () => item.type === 'lvl1' && index === 0,
                  __is_guide: () => item.hierarchy.lvl0 === 'Guides',
                  __is_child: () =>
                    item.type !== 'lvl1' &&
                    items.length > 1 &&
                    items[0].type === 'lvl1' &&
                    index !== 0,
                  __is_first: () => index === 1,
                  __is_last: () => index === items.length - 1 && index !== 0,
                }
              })
            }}
          />,
          document.body
        )}
    </>
  )
}

// @ts-ignore
function Hit({ hit, children }) {
  return (
    <Link href={hit.url}>
      <a
        className={clsx({
          'DocSearch-Hit--Result': hit.__is_result?.(),
          'DocSearch-Hit--Parent': hit.__is_parent?.(),
          'DocSearch-Hit--FirstChild': hit.__is_first?.(),
          'DocSearch-Hit--LastChild': hit.__is_last?.(),
          'DocSearch-Hit--Child': hit.__is_child?.(),
          'DocSearch-Hit--Guide': hit.__is_guide?.(),
        })}
      >
        {children}
      </a>
    </Link>
  )
}

// @ts-ignore
export function SearchButton({ children, ...props }) {
  let searchButtonRef = useRef()
  let actionKey = useActionKey()
  // @ts-ignore
  let { onOpen, onInput } = useContext(SearchContext)

  useEffect(() => {
    // @ts-ignore
    function onKeyDown(event) {
      if (searchButtonRef && searchButtonRef.current === document.activeElement && onInput) {
        if (/[a-zA-Z0-9]/.test(String.fromCharCode(event.keyCode))) {
          onInput(event)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onInput, searchButtonRef])

  return (
    // @ts-ignore
    <button type="button" ref={searchButtonRef} onClick={onOpen} {...props}>
      {typeof children === 'function' ? children({ actionKey }) : children}
    </button>
  )
}

// @ts-ignore
function useDocSearchKeyboardEvents({ isOpen, onOpen, onClose }) {
  useEffect(() => {
    // @ts-ignore
    function onKeyDown(event) {
      function open() {
        // We check that no other DocSearch modal is showing before opening
        // another one.
        if (!document.body.classList.contains('DocSearch--active')) {
          onOpen()
        }
      }

      if (
        (event.keyCode === 27 && isOpen) ||
        (event.key === 'k' && (event.metaKey || event.ctrlKey)) ||
        (!isEditingContent(event) && event.key === '/' && !isOpen)
      ) {
        event.preventDefault()

        if (isOpen) {
          onClose()
        } else if (!document.body.classList.contains('DocSearch--active')) {
          open()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onOpen, onClose])
}

// @ts-ignore
function isEditingContent(event) {
  let element = event.target
  let tagName = element.tagName
  return (
    element.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'SELECT' ||
    tagName === 'TEXTAREA'
  )
}

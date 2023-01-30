import { render } from 'react-dom'
import { IconCommand } from 'ui'
import { createElement, FC, useEffect, useRef, Fragment } from 'react'
import algoliasearch from 'algoliasearch/lite'
import { autocomplete, getAlgoliaResults } from '@algolia/autocomplete-js'
import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches'
import { useRouter } from 'next/router'

// [Joshen] We're currently using DocSearch from Algolia as it provides a nice
// UI out of the box + some good preconfigured search settings (e.g hierarchy).
// However, we're using our own Algolia account to store the records in the indexes
// (rather than going through the DocSearch program from Algolia where they'll crawl
// our site for us). Refer to scripts/build-search on how we're saving the records.

// Using Algolia's autocomplete library gives us full flexbility in terms of customizing
// our search experience, but that will take time to figure out. Hence why for now we're just
// using DocSearch with our own records.

// Potentially for search, we could
// - Go ahead with the DocSearch program and let them crawl our site to generate the records
//   - But we need to ensure that our site is semantically correct first
// - Use Algolia itself to flesh out our own search logic
//   - The basics are already set up to be honest, but will take time to make it great
// - Go back to Typesense if we deem that Algolia is not helpful in the long run

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
)

// [Joshen] Not working properly, but lets not get stuck on this
// Priority just to get a search working
const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: 'docs-search',
  limit: 3,
  //@ts-ignore
  transformSource({ source }) {
    return {
      ...source,
      templates: {
        ...source.templates,
        header({ state }) {
          if (state.query) return null
          return (
            <Fragment>
              <span className="aa-SourceHeaderTitle">Your searches</span>
              <div className="aa-SourceHeaderLine" />
            </Fragment>
          )
        },
      },
    }
  },
})

interface Props {}

const AlgoliaSearch: FC<Props> = ({}) => {
  const searchRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (!searchRef.current) {
      return undefined
    }
    const search = autocomplete({
      openOnFocus: true,
      container: searchRef.current,
      defaultActiveItemId: 0,
      detachedMediaQuery: '',
      // @ts-ignore
      renderer: { createElement, Fragment, render },
      placeholder: 'Search docs',
      plugins: [recentSearchesPlugin],
      renderNoResults({ state, render }, root) {
        render(
          <div className="text-scale-1100 py-2 text-sm px-4">
            No results found for {state.query}.
          </div>,
          root
        )
      },
      navigator: {
        navigate({ itemUrl }) {
          router.push(itemUrl)
        },
      },
      onSelect({ item, setQuery, setIsOpen, refresh }) {
        //console.log('onSelect', item.url)
      },
      // @ts-ignore
      getSources({ query }) {
        return [
          {
            sourceId: 'pages',
            templates: {
              item({ item, components }) {
                return (
                  <a
                    href={item.url as string}
                    className="aa-ItemLink truncate flex justify-between space-x-4"
                  >
                    <div className="aa-ItemContent w-full">
                      <div className="aa-ItemTitle flex items-center space-x-1">
                        {item.category && (
                          <p
                            className={`${
                              ['cli', 'api'].includes(item.category as string)
                                ? 'uppercase'
                                : 'capitalize'
                            }`}
                          >
                            <>
                              {item.category}
                              {item.version ? ` (${item.version})` : ''}:
                            </>
                          </p>
                        )}
                        <p>
                          <components.Highlight hit={item} attribute="title" />
                        </p>
                      </div>
                      <p className="aa-ItemContentSubtitle">{item.description as string}</p>
                    </div>
                  </a>
                )
              },
            },
            getItemUrl({ item }) {
              return item.url
            },
            getItems() {
              // if (!query) return []
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: 'dev_docs',
                    query,
                  },
                ],
              })
            },
          },
        ]
      },
    })

    return () => {
      search.destroy()
    }
  }, [])

  return (
    <div className="w-[200px] relative">
      <div ref={searchRef} />
      <div className="flex items-center space-x-1 absolute top-[7px] right-2">
        <div className="text-scale-1200 flex items-center justify-center h-6 w-6 rounded bg-scale-500">
          <IconCommand size={12} strokeWidth={1.5} />
        </div>
        <div className="text-xs text-scale-1200 flex items-center justify-center h-6 w-6 rounded bg-scale-500">
          K
        </div>
      </div>
    </div>
  )
}

export default AlgoliaSearch

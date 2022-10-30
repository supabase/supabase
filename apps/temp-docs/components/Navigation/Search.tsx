import { render } from 'react-dom'
import { Badge, IconCommand } from 'ui'
import { createElement, FC, useEffect, useRef, Fragment } from 'react'
import algoliasearch from 'algoliasearch/lite'
import { autocomplete, getAlgoliaResults } from '@algolia/autocomplete-js'
import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches'
import Link from 'next/link'

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

const Search: FC<Props> = ({}) => {
  const searchRef = useRef(null)

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
      // @ts-ignore
      getSources({ query }) {
        return [
          {
            sourceId: 'pages',
            templates: {
              item({ item, components }) {
                return (
                  <Link href={item.url as string}>
                    <a className="aa-ItemLink truncate flex justify-between space-x-4">
                      <div className="aa-ItemContent w-full">
                        <div className="aa-ItemTitle flex items-center space-x-1">
                          {item.category && (
                            <p
                              className={`${item.category === 'cli' ? 'uppercase' : 'capitalize'}`}
                            >
                              {item.category}
                              {item.version ? ` (${item.version})` : ''}:
                            </p>
                          )}
                          <p>
                            <components.Highlight hit={item} attribute="title" />
                          </p>
                        </div>
                        <p className="aa-ItemContentSubtitle">{item.description}</p>
                      </div>
                      {/* <div>
                        <Badge color="gray">{item.source}</Badge>
                      </div> */}
                    </a>
                  </Link>
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
            onSelect({ item, setQuery, setIsOpen, refresh }) {},
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

export default Search

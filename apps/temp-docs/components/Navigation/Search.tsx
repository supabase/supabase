import { render } from 'react-dom'
import { createElement, FC, useEffect, useRef, Fragment } from 'react'
import algoliasearch from 'algoliasearch/lite'
import { autocomplete, getAlgoliaResults } from '@algolia/autocomplete-js'
import '@algolia/autocomplete-theme-classic'

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
)

interface Props {}

const Search: FC<Props> = ({}) => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) {
      return undefined
    }
    const search = autocomplete({
      openOnFocus: true,
      container: containerRef.current,
      defaultActiveItemId: 0,
      detachedMediaQuery: '',
      // @ts-ignore
      renderer: { createElement, Fragment, render },
      // @ts-ignore
      getSources({ query }) {
        return [
          {
            sourceId: 'pages',
            templates: {
              item({ item, components }) {
                return (
                  <a href={item.url as string} className="aa-ItemLink">
                    <div className="aa-ItemContent">
                      <div className="aa-ItemTitle">
                        <components.Highlight hit={item} attribute="title" />
                      </div>
                    </div>
                  </a>
                )
              },
            },
            getItems() {
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

  return <div ref={containerRef}></div>
}

export default Search

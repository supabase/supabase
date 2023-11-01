import SVG from 'react-inlinesvg'
import { BASE_PATH } from 'lib/constants'

// [Joshen] To be deprecated in favor of NoSearchResults in components/ui

export const NoSearchResults = () => {
  return (
    <div className="flex h-64 flex-col items-center justify-center">
      <SVG
        src={`${BASE_PATH}/img/no-search-results.svg`}
        preProcessor={(code) =>
          code.replace(/svg/, 'svg className="mb-2 w-16 h-16 text-color-inherit"')
        }
      />
      <p className="w-64 text-center text-sm opacity-50">
        Hmm, we couldn't find any results that match your query.
      </p>
    </div>
  )
}

export default NoSearchResults

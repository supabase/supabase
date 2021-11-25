import SVG from 'react-inlinesvg'
import { Typography } from '@supabase/ui'

export const NoSearchResults = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <SVG
        src="/img/no-search-results.svg"
        preProcessor={(code) =>
          code.replace(/svg/, 'svg className="mb-2 w-16 h-16 text-color-inherit"')
        }
      />
      <Typography.Text className="text-sm w-64 text-center opacity-50">
        Hmm, we couldn't find any results that matches your query. Try another?
      </Typography.Text>
    </div>
  )
}

export default NoSearchResults

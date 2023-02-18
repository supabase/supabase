import { FC } from 'react'
import { IconBookOpen, IconHash } from '~/../../packages/ui'

export enum SearchResultType {
  Document = 'document',
  Section = 'section',
}

type Props = {
  type: SearchResultType
  title: string
  chip?: string
}

const SearchResult: FC<Props> = ({ type, title, chip }) => {
  return (
    <a
      className="flex flex-row items-center bg-scale-500 hover:bg-scale-700 transition p-4 rounded-md border border-scale-600 text-sm cursor-pointer"
      onClick={close}
    >
      <div className="w-6 h-6 p-1 flex items-center justify-center mr-4 text-brand-1100 rounded-md bg-scale-700">
        {getIconByType(type)}
      </div>
      <div className="flex flex-col gap-2 items-start">
        {chip && (
          <div className="rounded-xl bg-scale-700 pl-3 pr-3 pt-0.5 pb-0.5 text-xs text-scale-1100">
            {chip}
          </div>
        )}
        <div>{title}</div>
      </div>
    </a>
  )
}

function getIconByType(type: SearchResultType) {
  switch (type) {
    case SearchResultType.Document:
      return <IconBookOpen />
    case SearchResultType.Section:
      return <IconHash />
    default:
      throw new Error(`Unknown search result type '${type}'`)
  }
}

export default SearchResult

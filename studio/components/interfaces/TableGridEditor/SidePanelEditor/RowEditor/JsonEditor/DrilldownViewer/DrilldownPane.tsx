import { isNull, noop } from 'lodash'
import { IconChevronRight } from 'ui'

import { Dictionary } from 'components/grid'

interface DrilldownPaneProps {
  pane: number
  jsonData: Dictionary<any>
  activeKey?: string
  onSelectKey: (key: string, pane: number) => void
}

const DrilldownPane = ({ pane, jsonData, activeKey, onSelectKey = noop }: DrilldownPaneProps) => {
  if (!jsonData) {
    return (
      <div className={`flex-1 ${pane === 2 ? 'border-l border-gray-500' : ''}`}>
        <div className="flex space-x-2 py-2 px-5">
          <p className="text-sm">Invalid JSON</p>
        </div>
      </div>
    )
  }

  if (Object.keys(jsonData).length === 0) {
    return (
      <div className={`max-w-[50%] flex-1 ${pane === 2 ? 'border-l border-gray-500' : ''}`}>
        <div className="flex space-x-2 py-2 px-5">
          <p className="text-sm opacity-50">No data available</p>
        </div>
      </div>
    )
  }

  const keysWithChildren = Object.keys(jsonData).filter(
    (key: string) => typeof jsonData[key] === 'object' && !isNull(jsonData[key])
  )

  const keysWithoutChildren = Object.keys(jsonData).filter(
    (key: string) => isNull(jsonData[key]) || typeof jsonData[key] !== 'object'
  )

  return (
    <div className={`max-w-[50%] flex-1 ${pane === 2 ? 'border-l border-gray-500' : ''}`}>
      {keysWithChildren.map((key: string) => (
        <div
          key={key}
          className={`
              ${key === activeKey ? 'bg-gray-100 dark:bg-gray-400' : ''}
              group flex cursor-pointer items-center
              justify-between py-2 px-5 hover:bg-gray-100 dark:hover:bg-gray-500
            `}
          onClick={() => onSelectKey(key, pane)}
        >
          <p className="font-mono text-xs !text-blue-700 dark:!text-blue-1100">{key}</p>
          <div className={`${key === activeKey ? 'block' : 'hidden'} group-hover:block`}>
            <IconChevronRight strokeWidth={2} size={16} />
          </div>
        </div>
      ))}
      {keysWithoutChildren.map((key: string) => (
        <div key={key} className="flex space-x-2 py-2 px-5">
          <p className="font-mono text-xs !text-blue-700 dark:!text-blue-1100">{key}:</p>
          <p
            className={`break-all font-mono text-xs ${
              typeof jsonData[key] !== 'string'
                ? '!text-green-700 dark:!text-green-1000'
                : '!text-yellow-700 dark:!text-yellow-900'
            }`}
          >
            {isNull(jsonData[key])
              ? 'null'
              : typeof jsonData[key] === 'string'
              ? `"${jsonData[key]}"`
              : jsonData[key].toString()}
          </p>
        </div>
      ))}
    </div>
  )
}

export default DrilldownPane

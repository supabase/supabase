import { at } from 'lodash'
import { ReactNode } from 'react'
import { config, logConstants } from 'shared-data'

const sharedData = {
  config,
  logConstants,
}

/**
 * A wrapper component to access data from the `shared-data` package within MDX
 * files.
 *
 * @param children - Can be a string, which represents the path to a data item,
 *                   or a function, which takes the data object as an argument,
 *                   and returns a ReactNode.
 */
function SharedData({
  data,
  children,
}: {
  data: keyof typeof sharedData
  children: ((selectedData: (typeof sharedData)[keyof typeof sharedData]) => ReactNode) | string
}) {
  const selectedData = sharedData[data]
  return typeof children === 'string'
    ? (at(selectedData, [children])[0] as unknown as ReactNode)
    : children(selectedData)
}

export { SharedData }

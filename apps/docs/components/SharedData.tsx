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
 * @param children - How to access the shared data. If it is a render function,
 *                   it takes the data object as a param. If it is a string, it
 *                   takes a path through the data object, formatted like
 *                   `a[0].b.c`. This path should lead to either a renderable
 *                   type or a nested object. If it leads to an object, the
 *                   return value is `${object.value} ${object.unit}`.
 */
function SharedData({
  data,
  children,
}: {
  data: keyof typeof sharedData
  children: ((selectedData: (typeof sharedData)[keyof typeof sharedData]) => ReactNode) | string
}) {
  let selectedData = sharedData[data] as any
  return typeof children === 'string'
    ? ((typeof (selectedData = at(selectedData, [children])[0]) === 'object'
        ? `${selectedData.value ?? ''} ${selectedData.unit ?? ''}`.trim()
        : selectedData) as unknown as ReactNode)
    : children(selectedData)
}

export { SharedData }

import { ReactNode } from 'react'
import { logConstants } from 'shared-data'

const sharedData = {
  logConstants,
}

function SharedData({
  data,
  children,
}: {
  data: keyof typeof sharedData
  children: (selectedData: (typeof sharedData)[keyof typeof sharedData]) => ReactNode
}) {
  const selectedData = sharedData[data]
  return children(selectedData)
}

export { SharedData }

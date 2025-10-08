import { isEmpty, last } from 'lodash'
import { useState } from 'react'

import type { Dictionary } from 'types'
import DrilldownBreadCrumbs from './DrilldownBreadCrumbs'
import DrilldownPane from './DrilldownPane'

interface DrilldownViewerProps {
  jsonData: Dictionary<any>
}

const DrilldownViewer = ({ jsonData = {} }: DrilldownViewerProps) => {
  const [activeKey, setActiveKey] = useState<string>()
  const [breadCrumbs, setBreadCrumbs] = useState<string[]>([])
  const [jsonPane1, setJsonPane1] = useState<Dictionary<any>>(jsonData)
  const [jsonPane2, setJsonPane2] = useState<Dictionary<any>>({})

  const selectKey = (key: string, pane: number) => {
    setActiveKey(key)
    const updatedBreadCrumbs = breadCrumbs.slice()
    if (pane === 1) {
      setJsonPane2(jsonPane1[key])

      if (isEmpty(jsonPane2)) {
        updatedBreadCrumbs.push(key)
        setBreadCrumbs(updatedBreadCrumbs)
      } else {
        updatedBreadCrumbs.pop()
        updatedBreadCrumbs.push(key)
        setBreadCrumbs(updatedBreadCrumbs)
      }
    }
    if (pane === 2) {
      setJsonPane1(jsonPane2)
      setJsonPane2(jsonPane2[key])

      updatedBreadCrumbs.push(key)
      setBreadCrumbs(updatedBreadCrumbs)
    }
  }

  const resetBreadcrumbs = () => {
    setActiveKey(undefined)
    setBreadCrumbs([])
    setJsonPane1(jsonData)
    setJsonPane2({})
  }

  const selectBreadcrumb = (crumbPath: string[]) => {
    const key = last(crumbPath) || ''
    setActiveKey(key)
    let updatedJsonData = { ...jsonData }
    const _breadCrumbs = breadCrumbs.slice(0, breadCrumbs.indexOf(key) + 1)
    setBreadCrumbs(_breadCrumbs)
    if (crumbPath === null) {
      setJsonPane1(updatedJsonData)
      setJsonPane2({})
    } else {
      if (crumbPath.length === 1) {
        setJsonPane1(updatedJsonData)
        setJsonPane2(jsonData[breadCrumbs[0]])
      } else {
        for (const crumb of crumbPath) {
          updatedJsonData = updatedJsonData[crumb]
          if (crumbPath.indexOf(crumb) === crumbPath.length - 2) {
            setJsonPane1(updatedJsonData)
          }
        }
        setJsonPane2(updatedJsonData)
      }
    }
  }

  return (
    <div className="border border-x-0 border-t-0 border-muted">
      <div className="h-10 px-3 flex-initial flex items-center justify-between">
        <DrilldownBreadCrumbs
          breadcrumbs={breadCrumbs}
          onSelectBreadcrumb={selectBreadcrumb}
          resetBreadcrumbs={resetBreadcrumbs}
        />
      </div>
      <div className="flex items-stretch flex-auto justify-between border-t border-muted">
        <DrilldownPane
          pane={1}
          jsonData={jsonPane1}
          onSelectKey={selectKey}
          activeKey={activeKey}
        />
        <DrilldownPane pane={2} jsonData={jsonPane2} onSelectKey={selectKey} />
      </div>
    </div>
  )
}

export default DrilldownViewer

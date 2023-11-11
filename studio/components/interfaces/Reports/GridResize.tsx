import RGL, { WidthProvider } from 'react-grid-layout'

import { LAYOUT_COLUMN_COUNT } from './Reports.constants'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'

const ReactGridLayout = WidthProvider(RGL)

const GridResize = ({ startDate, endDate, interval, editableReport, setEditableReport }: any) => {
  if (!editableReport) return null

  function onLayoutChange(layout: any) {
    let updatedLayout = editableReport.layout
    layout.map((item: any) => {
      const index = updatedLayout.findIndex((x: any) => x.id === item.i)
      updatedLayout[index].w = layout[index].w
      updatedLayout[index].h = layout[index].h
      updatedLayout[index].x = layout[index].x
      updatedLayout[index].y = layout[index].y
    })
    const payload = {
      ...editableReport,
      layout: updatedLayout,
    }
    setEditableReport(payload)
  }

  return (
    <>
      <ReactGridLayout
        autoSize={true}
        layout={editableReport}
        onLayoutChange={(layout) => onLayoutChange(layout)}
        rowHeight={60}
        cols={LAYOUT_COLUMN_COUNT}
        containerPadding={[0, 0]}
        compactType="horizontal"
      >
        {editableReport.layout.map((x: any, i: number) => {
          return (
            <div
              key={x.id}
              data-grid={{ ...x, minH: 4, maxH: 4, minW: 8 }}
              className="react-grid-layout__report-item bg-surface-100 border-overlay group relative rounded border px-6 py-4 shadow-sm hover:border-green-900 dark:hover:border-green-900"
            >
              <ChartHandler
                startDate={startDate}
                endDate={endDate}
                interval={interval}
                attribute={x.attribute}
                provider={x.provider}
                label={x.label}
                customDateFormat={'MMM D, YYYY'}
              />
              <div className="absolute inset-x-0 top-3 ">
                <div className="flex justify-around">
                  <div className="flex h-3 w-24 cursor-move flex-col space-y-2">
                    <div className="hidden h-3 w-full border-4 border-dotted border-green-900 opacity-50 transition-all hover:opacity-100 group-hover:block"></div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </ReactGridLayout>
    </>
  )
}

export default GridResize

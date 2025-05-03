import { HorizontalWaterfallChart, WaterfallDataItem } from 'ui-patterns/HorizontalWaterfallChart'

export default function HorizontalWaterfallChartDemo() {
  const requestWaterfall: WaterfallDataItem[] = [
    { label: 'DNS Lookup', start: 0, duration: 50, type: 'dns' },
    { label: 'TCP Connect', start: 50, duration: 100, type: 'tcp' },
    { label: 'SSL Handshake', start: 150, duration: 80, type: 'ssl' },
    { label: 'Request Sent', start: 230, duration: 20, type: 'request' },
    { label: 'TTFB', start: 250, duration: 120, type: 'ttfb' },
    { label: 'Content Download', start: 370, duration: 200, type: 'download' },
  ]

  return (
    <HorizontalWaterfallChart
      data={requestWaterfall}
      title="waterfall"
      subtitle="subtitle"
      tooltipFormatter={(params) => {
        const { name, value: duration } = params[1]
        return `${name}:  ${duration}ms`
      }}
    />
  )
}

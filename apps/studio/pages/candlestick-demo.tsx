import CandlestickChartExample from 'components/ui/Charts/CandlestickChartExample'
import { NextPage } from 'next'

const CandlestickDemoPage: NextPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-8">Candlestick Chart Demo</h1>
      <div className="max-w-4xl mx-auto">
        <CandlestickChartExample />
      </div>
    </div>
  )
}

export default CandlestickDemoPage

import TimelineExample from 'components/ui/Charts/TimelineExample'
import { NextPage } from 'next'

const TimelineExamplePage: NextPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-8">Timeline Example</h1>
      <div className="max-w-4xl mx-auto">
        <TimelineExample />
      </div>
    </div>
  )
}

export default TimelineExamplePage

import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { NextPageWithLayout } from 'types'

const Realtime: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a template for realtime pages</h1> */}</>
}

Realtime.getLayout = (page) => <RealtimeLayout title="Realtime">{page}</RealtimeLayout>

export default Realtime

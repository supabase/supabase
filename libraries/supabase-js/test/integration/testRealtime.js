import { assert } from 'chai'
import { createClient } from '../../src'

// on()
// subscribe()
// unsubscribe()
// removeSubscription()
// getSubscriptions()
describe('test subscribing to an insert', () => {
  const supabase = createClient('http://localhost:8000', 'examplekey')

  it('on() and subscribe()', async () => {
    function callbackAction(record) {
      assert(record.new.message === 'hello', 'inserted message is incorrect')
      console.log("ASSERT MADE")
    }
    await supabase
      .from('messages')
      .on('*', callbackAction)
      .subscribe()

    await supabase.from('messages').insert([{ message: 'hello', user_id: 1, channel_id: 1 }])
  }).timeout(10000)
})

after(async () => {
  setTimeout(() => process.exit(0), 5000)
})

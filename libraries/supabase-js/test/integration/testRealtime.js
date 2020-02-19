import { assert } from 'chai'
import { createClient } from '../../src'

// on()
// subscribe()
// unsubscribe()
// removeSubscription()
// getSubscriptions()
describe('test subscribing to an insert', () => {
  const supabase = createClient('http://localhost:8000', 'examplekey')

  afterEach(function() {
    for (const key in supabase.subscriptions) {
      console.log(`removing: ${key}`)
      console.log(supabase.subscriptions[key])
      supabase.removeSubscription(supabase.subscriptions[key])
    }
  })

  it('on() and subscribe()', async () => {
    function callbackAction(record) {
      assert(record.new.message === 'hello', 'insert made')
    }
    const mySubscription = await supabase
      .from('messages')
      .on('*', callbackAction)
      .subscribe()
    const response = await supabase
      .from('messages')
      .insert([{ message: 'hello', user_id: 1, channel_id: 1 }])
  }).timeout(10000)
})

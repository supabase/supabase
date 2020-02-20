import { assert } from 'chai'
import { createClient } from '../../src'

// on()
// subscribe()
// unsubscribe()
// removeSubscription()
// getSubscriptions()
describe('test subscribing to an insert', () => {
  const supabase = createClient('http://localhost:8000', 'examplekey')

  afterEach(async() => {
    console.log(supabase.getSubscriptions())
    for (let subscription of supabase.getSubscriptions()) {
      supabase.removeSubscription(subscription)
    }
  })

  it('on() and subscribe()', done => {
    function callbackAction(record) {
      assert(record.new.message === 'hello', 'inserted message is incorrect')
      done()
    }
    supabase
      .from('messages')
      .on('*', callbackAction)
      .subscribe()

    supabase.from('messages').insert([{ message: 'hello', user_id: 1, channel_id: 1 }])
  }).timeout(10000)
})

after(async () => {
  setTimeout(() => process.exit(0), 5000)
})

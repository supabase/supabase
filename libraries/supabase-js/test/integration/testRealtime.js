import { assert } from 'chai'
import { createClient } from '../../src'

// on()
// subscribe()
// unsubscribe()
// removeSubscription()
// getSubscriptions()
describe('test subscribing to an insert', () => {
  const supabase = createClient('http://localhost:8000', 'examplekey')

  it('on() and subscribe()', done => {
    const callbackAction = record => {
      console.log('Assert made')
      assert(record.new.message === 'hello, mocha', 'inserted message is incorrect')
      done()
    }

    // subscribe
    const subscription = supabase
      .from('messages')
      .on('INSERT', callbackAction)
      .subscribe()

    // make sure message only being sent after channel open
    subscription.socket.conn.addEventListener('open', (event) => {
      console.log("SAQCET OPEN")
      supabase
      .from('messages')
      .insert([{ message: 'hello, mocha', user_id: 1, channel_id: 1 }])
      .then(console.log)
      .catch(console.error)
    });

    // prove that the binding is on the channel
    setTimeout(()=>console.log(subscription.channel.bindings[3].callback.toString()), 5000)
  }).timeout(15000)
})

after(async () => {
  setTimeout(() => process.exit(0), 5000)
})

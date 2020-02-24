import { assert } from 'chai'
import { createClient } from '../../src'

// on()
// subscribe()
// unsubscribe()
// removeSubscription()
// getSubscriptions()
describe('test subscribing to an insert', function () {
  const supabase = createClient('http://localhost:8000', 'examplekey')

  afterEach(function() {
    const subscriptions = supabase.getSubscriptions()
    for (const sub of subscriptions) {
      supabase.removeSubscription(sub)
    }
  })

  // test double wildcard, all events, all tables
  it('from(*).on(*).subscribe()', function (done) {
    const callbackAction = function(record) {
      assert(record.new.message === 'hello, mocha', 'inserted message is incorrect')
      done()
    }
    const subscription = supabase
      .from('*')
      .on('*', callbackAction)
      .subscribe()

    subscription.channel.socket.conn.addEventListener('open', function (event) {
      supabase
      .from('messages')
      .insert([{ message: 'hello, mocha', user_id: 1, channel_id: 1 }])
      .then()
      .catch(console.error)
    });
  }).timeout(15000)

  // test events on specific table
  it('from("messages").on("*").subscribe()', function (done) {
    const callbackAction = function(record) {
      assert(record.new.message === 'hello, mocha fans', 'inserted message is incorrect')
      done()
    }
    const subscription = supabase
      .from('messages')
      .on('*', callbackAction)
      .subscribe()

    subscription.channel.socket.conn.addEventListener('open', function (event) {
      supabase
      .from('messages')
      .insert([{ message: 'hello, mocha fans', user_id: 1, channel_id: 1 }])
      .then()
      .catch(console.error)
    });
  }).timeout(15000)

  // test on INSERT
  it('from("*").on("INSERT").subscribe()', function (done) {
    const callbackAction = function(record) {
      assert(record.new.message === 'hello, mocha fans, Y2K', 'inserted message is incorrect')
      done()
    }
    const subscription = supabase
      .from('*')
      .on('INSERT', callbackAction)
      .subscribe()

    subscription.channel.socket.conn.addEventListener('open', function (event) {
      supabase
      .from('messages')
      .insert([{ message: 'hello, mocha fans, Y2K', user_id: 1, channel_id: 1 }])
      .then()
      .catch(console.error)
    });
  }).timeout(15000)
})

after(function() {
  setTimeout(() => process.exit(0), 5000)
})

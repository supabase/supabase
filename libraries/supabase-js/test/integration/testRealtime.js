import { assert } from 'chai'
import { createClient } from '../../src'

// on()
// subscribe()
// unsubscribe()
// removeSubscription()
// getSubscriptions()
describe('test subscribing to an insert', function() {
  const supabase = createClient('http://localhost:8000', 'examplekey')

  afterEach(function() {
    const subscriptions = supabase.getSubscriptions()
    for (const sub of subscriptions) {
      supabase.removeSubscription(sub)
    }
  })

  // test adding and removing a subscription
  it('can add and remove a subscription', function() {
    const subscription = supabase
      .from('*')
      .on('*', null)
      .subscribe()

    assert(subscription.uuid === supabase.getSubscriptions()[0].uuid, "uuid's not equal")

    supabase.removeSubscription(subscription)

    assert(supabase.getSubscriptions().length === 0, 'subscriptions not empty')
  })

  // test double wildcard, all events, all tables
  it('from(*).on(*).subscribe()', function(done) {
    const callbackAction = function(record) {
      assert(record.new.message === 'hello, mocha', 'inserted message is incorrect')
      done()
    }
    const subscription = supabase
      .from('*')
      .on('*', callbackAction)
      .subscribe()

    subscription.channel.socket.conn.addEventListener('open', function(event) {
      supabase
        .from('messages')
        .insert([{ message: 'hello, mocha', user_id: 1, channel_id: 1 }])
        .then()
        .catch(console.error)
    })
  }).timeout(5000)

  // test events on specific table
  it('from("messages").on("*").subscribe()', function(done) {
    const callbackAction = function(record) {
      assert(record.new.message === 'hello, mocha fans', 'inserted message is incorrect')
      done()
    }
    const subscription = supabase
      .from('messages')
      .on('*', callbackAction)
      .subscribe()

    subscription.channel.socket.conn.addEventListener('open', function(event) {
      supabase
        .from('messages')
        .insert([{ message: 'hello, mocha fans', user_id: 1, channel_id: 1 }])
        .then()
        .catch(console.error)
    })
  }).timeout(5000)

  // test delete message
  it('from("messages").on("DELETE").subscribe()', function(done) {
    const callbackAction = function(record) {
      assert(record.old.id === 1, 'deleted message does not have correct id')
      done()
    }
    const subscription = supabase
      .from('messages')
      .on('DELETE', callbackAction)
      .subscribe()

    subscription.channel.socket.conn.addEventListener('open', function(event) {
      supabase
        .from('messages')
        .match({ id: 1 })
        .delete()
        .then()
        .catch(console.error)
    })
  }).timeout(5000)

  // test update message
  it('from(messages).on(UPDATE).subscribe()', function(done) {
    const callbackAction = function(record) {
      assert(
        record.new.message === 'updated message yo',
        'updated message does not have correct text'
      )
      done()
    }
    const subscription = supabase
      .from('messages')
      .on('UPDATE', callbackAction)
      .subscribe()

    subscription.channel.socket.conn.addEventListener('open', function(event) {
      supabase
        .from('messages')
        .match({ id: 1 })
        .update({ message: 'updated message yo' })
        .then()
        .catch(console.error)
    })
  }).timeout(5000)

  // test on INSERT
  it('from("*").on("INSERT").subscribe()', function(done) {
    const callbackAction = function(record) {
      assert(record.new.message === 'hello, mocha fans, Y2K', 'inserted message is incorrect')
      done()
    }
    const subscription = supabase
      .from('*')
      .on('INSERT', callbackAction)
      .subscribe()

    subscription.channel.socket.conn.addEventListener('open', function(event) {
      supabase
        .from('messages')
        .insert([{ message: 'hello, mocha fans, Y2K', user_id: 1, channel_id: 1 }])
        .then()
        .catch(console.error)
    })
  }).timeout(5000)
})

after(function() {
  setTimeout(() => process.exit(0), 5000)
})

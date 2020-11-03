<script>
  import { onMount } from 'svelte'
  // import {CHANNEL_STATES} from '@svelte/realtime-js'
  import TailwindStyles from './TailwindStyles.svelte'
  import Login from './Login.svelte'
  import LoggedIn from './LoggedIn.svelte'
  let user
  onMount(async () => {
    let userString = await localStorage.getItem('user-todolist')
    if (userString) {
      user = JSON.parse(userString)
    }
  })
  // // uncomment below for autologin while testing
//  import Supabase from '@supabase/supabase-js'
  import {createClient} from '@supabase/supabase-js'

  const {
    SNOWPACK_PUBLIC_SUPABASE_URL,
    SNOWPACK_PUBLIC_SUPABASE_KEY,
    SNOWPACK_PUBLIC_USER,
    SNOWPACK_PUBLIC_PASSWORD,
  } = import.meta.env
  const supabase = createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
  async function login() {
    try {
      const { body } = await supabase.auth.signIn(SNOWPACK_PUBLIC_USER, SNOWPACK_PUBLIC_PASSWORD)
      user = body.user
      return user
    } catch (error) {
      console.error({ error })
      if (error.response === undefined) {
        // No response from server
      } else {
        const server_response = error.response
        // Here you can further process the response ..
      }

      if (error.status === undefined) {
        // No HTTP status code
      } else {
        const http_code = error.status
        // Further processing ..
      }
    }
    return null
  }
  // if (!user) {
  //   user = login()
  //   console.log('logging in')

  //   // login().then(res=>{
  //   //   user=res
  //   //   localStorage.setItem('user-todolist', JSON.stringify(user))
  //   // }).catch(err=>{
  //   //   console.error(err)
  //   // })
  // }
  const mySubscription = supabase
    .from('public:*')
    .on('*', (payload) => {
      switch (payload.eventType) {
        case 'DELETE':
          if (payload.table === 'tasks') {
          } else if (payload.table === 'lists') {
          } else {
            console.error(`error ${payload.eventType} ${payload.table}`)
          }
          break
        case 'INSERT':
          break
        case 'UPDATE':
          break
        default:
          console.error(payload.eventType)
      }
      console.log(' Change received!', payload)
    })
    .subscribe()
  $: inserts = []
  $: updates = []
  $: deletes = []
  let status
  let connected = false
  let publicSchema
  const getRealtimeSocket = async (realtime) => {
    let socket = realtime.socket
    socket.onOpen(() => {
      connected = true
      console.log('connected',{ state: socket.isConnected() })
    })
    socket.onClose(() => {
      connected = false
      console.debug(`${socket.conn.realtimeUrl}: REALTIME DISCONNECTED`)
    })
    //await socket.connect()
    // while(socket.conn.readyState!== 4){
    //   console.log('not connected {}', socket)
    //   return null
    // }
    const channel = socket.channel[0]
    const url = socket.conn.url
    publicSchema = socket.channel('realtime:public')
    publicSchema.on('INSERT', (e) => (inserts = [...inserts, e]))
    publicSchema.on('UPDATE', (e) => (updates = [...updates, e]))
    publicSchema.on('DELETE', (e) => (deletes = [...deletes, e]))

    console.log({ joined: publicSchema.isJoined() })
    // publicSchema.receive('ok', ()=>console.log('joined'))

    // publicSchema.onError(() => status='ERROR')
    // publicSchema.onClose(() => status='Closed gracefully.')
    // onMessage
    // publicSchema
    // .subscribe()
    // .receive('ok', () => (status = 'SUBSCRIBED'))
    // .receive('error', () => (status = 'FAILED'))
    // .receive('timeout', () => (status = 'Timed out, retrying.'))
  }
  const fetch = async () => {
    const socket = await supabase.from('tasks').select('*')
    // socket.onOpen(() => console.log('Socket opened.'))
    // socket.onClose(() => console.log('Socket closed.'))
    // socket.onError((e) => console.log('Socket error', e.message))
    // socket.on('INSERT', (e) => console.log(`INSERT ${e}`))
    // socket.on('UPDATE', (e) => console.log(`UPDATE ${e}`))
    // socket.on('DELETE', (e) => console.log(`DELETE ${e}`))
    // socket
    //   .subscribe()
    //   .receive('ok', () => console.log('Connected.'))
    //   .receive('error', () => console.log('Failed.'))
    //   .receive('timeout', () => console.log('Timed out, retrying.'))
    // console.log({ socket })
    return socket
  }
  const realtimeOpen = (state) => {
    console.log({ state })
  }
  let changes
  let lists
  $: {
    // mySubscription.socket.connect()
    // ;(async ()=>{
      mySubscription?.socket?.channel[0]?.join().on('*', (change)=>{
        changes=change
        console.log('any', change)
      }).subscribe()
    // changes = getRealtimeSocket(mySubscription)
    // })()
    //mySubscription?.socket?.isConnected() ? mySubscription?.socket?.isConnected() : 'no' //? (true || mySubscription?.socket.isJoined() ?  getRealtimeSocket(mySubscription) : {}): {x:null} ?? null
    lists = user?.role === 'authenticated' ? fetch() : []
  }
  // $: mySubscription?.stateChangeCallbacks?.open?.push(realtimeOpen)
  //    $: changes = user?.role ==="authenticated" && mySubscription?.state ==="connected" ? getRealtimeSocket(mySubscription) : []

  {
    //  lists.onData((data) => console.log(data))
  }
  //$: reactiveLists = (lists) => JSON.stringify({ lists })
</script>

{status}

{#if user}
<!-- 
{#await lists}
    Loading Todo for
    {user.email}
  {:then lists}
    {JSON.stringify(user)}
    {JSON.stringify(lists)}
    {#if connected}
    {#await changes}
      Loading changes
    {:then changeResolved}
      changes
      {JSON.stringify(changeResolved)}
    {:catch err}
      {err}
    {/await}
    <div>
      <h3 className="">INSERTS</h3>
      {#each inserts as x, index}
        <pre
          key={x.commit_timestamp}
          className="text-xs overflow-scroll border border-black rounded-md my-2 p-2"
          style={{ maxHeight: 200 }}>
      {JSON.stringify(x, null, 2)}
    </pre>
      {/each}
    </div>
    <div>
      <h3 className="">UPDATES</h3>

      {#each updates as x, index}
        <pre
          key={x.commit_timestamp}
          className="text-xs overflow-scroll border border-black rounded-md my-2 p-2"
          style={{ maxHeight: 200 }}>
      {JSON.stringify(x, null, 2)}
    </pre>
      {/each}
    </div>
    <div>
      <h3 className="">DELETES</h3>
      {#each deletes as x, index}
        <pre
          key={x.commit_timestamp}
          className="text-xs overflow-scroll border border-black rounded-md my-2 p-2"
          style={{ maxHeight: 200 }}>
      {JSON.stringify(x, null, 2)}
    </pre>
      {/each}
    </div>
    {/if}
  {:catch err}
    {err}
  {/await}
 -->

  <LoggedIn bind:user />
{:else}
  <Login bind:user />
{/if}
<!-- {JSON.stringify(changes)} -->
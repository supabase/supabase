<script>
  import { onMount } from 'svelte'
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
  // import Supabase from '@supabase/supabase-js'
  // const {
  //   SNOWPACK_PUBLIC_SUPABASE_URL,
  //   SNOWPACK_PUBLIC_SUPABASE_KEY,
  //   SNOWPACK_PUBLIC_USER,
  //   SNOWPACK_PUBLIC_PASSWORD,
  // } = import.meta.env
  // const supabase = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
  // async function login() {
  //   try {
  //     const { body } = await supabase.auth.login(SNOWPACK_PUBLIC_USER, SNOWPACK_PUBLIC_PASSWORD)
  //     user = body.user
  //     return user
  //   } catch (error) {
  //     console.error({ error })
  //     if (error.response === undefined) {
  //       // No response from server
  //     } else {
  //       const server_response = error.response
  //       // Here you can further process the response ..
  //     }

  //     if (error.status === undefined) {
  //       // No HTTP status code
  //     } else {
  //       const http_code = error.status
  //       // Further processing ..
  //     }
  //   }
  //   return null
  // }
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
  ////{@debug user}
</script>

{#if user}
  <LoggedIn bind:user />
{:else}
  <Login bind:user />
{/if}

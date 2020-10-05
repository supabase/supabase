<script>
  import TailwindStyles from './TailwindStyles.svelte'
  import Login from './Login'
  import LoggedIn from './LoggedIn'

  let user
// // uncomment below for autologin while testing
//   import Supabase from '@supabase/supabase-js'
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
  //     console.log({ body })
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
  // user = login()

</script>

{#if user}
  <LoggedIn bind:user />
{:else}
  <Login bind:user />
{/if}

<script>
  import { onMount } from 'svelte'
  // import {CHANNEL_STATES} from '@svelte/realtime-js'
  import { createClient } from '@supabase/supabase-js'

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
</script>

{#if user}
  <LoggedIn bind:user />
{:else}
  <Login bind:user />
{/if}

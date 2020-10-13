<script>
  import TailwindStyles from './TailwindStyles.svelte'
  import Lists from './Lists.svelte'
  import { items, subscription } from './items'
  export let user
  let lists
  $: {
    lists = items()
  }
  // $: lists2 = subscription()
  // lists2.socket.isConnected() && lists2.socket.connectionState()
</script>

<Lists user_id="{user.id}" lists="{lists}" />
<button
  on:click="{() => {
    user = null
    localStorage.removeItem('user-todolist')
  }}"
>Logout</button>

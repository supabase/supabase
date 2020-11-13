<script>
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
  class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded text-green-700 border-green-500 hover:text-green-500 hover:bg-green-50 focus:outline-none focus:shadow-outline focus:border-green-300 transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10 float-left"
  on:click="{() => {
    user = null
    localStorage.removeItem('user-todolist')
  }}"
>Logout</button>

<script>
  import Items from './Items.svelte'

  import { addTask, updateTask, createList, fetchList } from './store'

  export let lists
  export let user_id
  export let list_id // default list  

  const ENTER_KEY = 13
  const ESCAPE_KEY = 27
  let currentFilter = 'all'
  let editing = null

  const updateView = () => {
    currentFilter = 'all'
    if (window.location.hash === '#/active') {
      currentFilter = 'active'
    } else if (window.location.hash === '#/completed') {
      currentFilter = 'completed'
    }
  }
  window.addEventListener('hashchange', updateView)
  updateView()

  function createNew(event) {
    if (event.which === ENTER_KEY) {
      addTask(event.target.value, list_id)
      event.target.value = ''
    }
  }
  if (!lists && user_id) {
    createList(user_id, window.prompt('list name'))
  } else {
  }
</script>



<style>

</style>
<header class="todos-center flex">
  <h1 class="rounded border border-teal-500 border-solid px-20 ">todos</h1>

  <!-- svelte-ignore a11y-autofocus -->
  <input
    class="shadow appearance-none border rounded w-full py-2 px-3 mr-4 text-grey-darker"
    on:keydown={createNew}
    placeholder="What needs to be done?"
    autofocus />
</header>
{#await lists then lists }
  
{#each lists as list}
  <!-- svelte-ignore a11y-autofocus -->
{list.name}
  <input
    class="shadow appearance-none border rounded w-full py-2 px-3 mr-4 text-grey-darker"
    on:keydown={createNew}
    placeholder="What needs to be done?"
    autofocus />

<Items list_id={list.id} items={list.tasks} bind:currentFilter bind:editing />
{/each}

{/await}

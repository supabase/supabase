<style>
</style>

<script>
  import Items from './Items.svelte'

  import { addTask, updateTask, createList, fetchList } from './store'

  export let lists
  export let user_id

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

  function createNewTask(event) {
    if (event.which === ENTER_KEY) {
      // TODO change to bind
      addTask(event.target.value, event.target.attributes.list_id.value)
      event.target.value = ''
    }
  }
  function createNewList(event) {
    createList(user_id, window.prompt('list name'))
  }
  if (!lists && user_id) {
    createNewList()
  }
</script>

<header class="todos-center flex">
  <h1 class="rounded border border-teal-500 border-solid px-20 ">todos</h1>
  <button on:click="{createNewList}">add new list</button>
</header>

{#await lists then lists}
  {#each lists as list}
    <!-- svelte-ignore a11y-autofocus -->
    <b>{
list.id
}</b>
    <u> {list.name} </u>
    <input
      list_id="{list.id}"
      class="shadow appearance-none border rounded w-full py-2 px-3 mr-4 text-grey-darker"
      on:keydown="{createNewTask}"
      placeholder="What needs to be done?"
      autofocus
    />

    <Items list_id="{list.id}" items="{list.tasks}" bind:currentFilter bind:editing />
  {/each}
{:catch err}
  {err}
{/await}

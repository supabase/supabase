<style>
</style>

<script>
  import Items from './Items.svelte'

  import { addTask, updateTask, createList, clearList, fetchList } from './store'
  import { items } from './items'
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
      // refetch list until bind and subscribe working
      setTimeout(async () => {
        lists = await items()
      }, 500)
    }
  }
  function createNewList(event) {
    createList(user_id, window.prompt('list name'))
  }
  async function removeList(lists, index, item_id) {
    clearList(item_id)
    // local
    lists = lists.slice(0, index).concat(lists.slice(index + 1))
  }
  if (!lists && user_id) {
    createNewList()
  }
</script>

<header class="todos-center flex">
  <h1 class="rounded border border-teal-500 border-solid px-20 ">todos</h1>
  <button 
  class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded text-green-700 border-green-500 hover:text-green-500 hover:bg-green-50 focus:outline-none focus:shadow-outline focus:border-green-300 transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10 float-left"

  on:click="{createNewList}">add new list</button>
</header>

{#await lists}
  Waiting for lists
{:then lists}
  {#each lists as list, index}
    <!-- svelte-ignore a11y-autofocus -->
    <b>{list.id}</b>
    <u> {list.name} </u>
    <button
      class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white
        hover:bg-red bg-red-600"
      on:click="{() => {
        removeList(lists, index, list.id)
      }}"
    >
      Clear list &cross;
    </button>
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

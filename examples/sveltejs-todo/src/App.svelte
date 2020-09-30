<script>
  import TailwindStyles from './TailwindStyles.svelte'

  import Items from './Items'
  import { getLists, getItems, items } from './items'
  import { addTask, updateTask, createList, fetchList } from './store'
  let lists
  let todos
  let LIST_ID

  $: lists = items()
  LIST_ID = lists && lists.length > 0 ? lists[0].id : 1

  $: todos = lists && lists.length > 0 ? lists[0].tasks : []
  if(!lists) {
    createList(uuid())
  }
  // || createList(LIST_ID)
  const ENTER_KEY = 13
  const ESCAPE_KEY = 27
  let currentFilter = 'all'
  let editing = null

  const updateView = () => {
    console.log({ lists, todos })
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
      addTask(event.target.value, LIST_ID)
      event.target.value = ''
    }
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }


</script>

{#await lists then lists}

  <header class="todos-center flex">
    <h1 class="rounded border border-teal-500 border-solid px-20 ">todos</h1>

    <!-- svelte-ignore a11y-autofocus -->
    <input
      class="shadow appearance-none border rounded w-full py-2 px-3 mr-4 text-grey-darker"
      on:keydown={createNew}
      placeholder="What needs to be done?"
      autofocus />
  </header>


  <Items items={lists[0].tasks} bind:currentFilter bind:editing />

{/await}

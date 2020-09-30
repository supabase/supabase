<script>
  import TailwindStyles from './TailwindStyles.svelte'

  import { getLists, getItems, items } from './items'
  import { addTask, updateTask, createList, fetchList } from './store'
  let lists
  let todos
  let LIST_ID

  $: lists = items()
  LIST_ID = lists && lists.length > 0 ? lists[0].id : 1

  $: todos = lists && lists.length > 0 ? lists[0].tasks : []

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
  function clearCompleted() {
    todos = todos.filter(item => !item.complete)
  }
  function remove(index) {
    todos = todos.slice(0, index).concat(todos.slice(index + 1))
  }
  function toggleAll(event) {
    todos = todos.map(item => ({
      id: item.id,
      description: item.description,
      complete: event.target.checked,
    }))
  }
  function createNew(event) {
    if (event.which === ENTER_KEY) {
      addTask(event.target.value, LIST_ID)
      event.target.value = ''
    }
  }
  function handleEdit(event) {
    if (event.which === ENTER_KEY) event.target.blur()
    else if (event.which === ESCAPE_KEY) editing = null
  }
  function submit(event) {
    updateTask(editing, event.target.value)
    editing = null
  }
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  $: filtered =
    currentFilter === 'all'
      ? todos
      : currentFilter === 'completed'
      ? todos.filter(item => item.complete)
      : todos.filter(item => !item.complete)
  $: numActive = todos ? todos.filter(item => !item.complete).length : 0
  $: numCompleted = todos ? todos.filter(item => item.complete).length : 0

  $: try {
    //		updateTask(todos)
    localStorage.setItem('todos-svelte', JSON.stringify(todos))
  } catch (err) {
    // noop
  }
</script>

{#await lists then lists}

  <header class="todos-center flex">
    <h1 class="rounded border border-teal-500 border-solid px-20 ">todos</h1>

    {#if lists.length > 0}
      {#each lists as list}
        {list.uuid} {list.id} {list.inserted_at} {list.updated_at}

				{#each list.tasks as task}{task.id} {task.task_text} {task.complete}{/each}
      {/each}
    {/if}
    <!-- svelte-ignore a11y-autofocus -->
    <input
      class="shadow appearance-none border rounded w-full py-2 px-3 mr-4 text-grey-darker"
      on:keydown={createNew}
      placeholder="What needs to be done?"
      autofocus />
  </header>
  Todos
  <pre>{JSON.stringify(lists[0].tasks)}</pre>
  Filtered
  <pre>{JSON.stringify(filtered)}</pre>
  {#if todos.length > 0}
    <section class="container bg-white rounded shadow p-6 m-4 w-full lg:w-3/4 lg:max-w-lg">
      <input
        id="toggle-all"
        class="inline-block mr-4"
        type="checkbox"
        on:change={toggleAll}
        checked={numCompleted === todos.length} />
      <label for="toggle-all">Mark all as complete</label>

      <ul class="mx-0 list-none bg-clip-padding">
        {#each filtered as item, index (item.id)}
          <li
            class="{item.complete ? 'line-through' : 'underline'}
            {editing === index ? 'editing' : ''} py-6 px-2 border-b bol border-grey-darkest flex
            justify-between todos-center relative todo__item">
            <div class="view">
              <input class="inline-block mr-4" type="checkbox" bind:checked={item.complete} />
              <label on:dblclick={() => (editing = index)} class="">{item.description}</label>
              <button
                on:click={() => remove(index)}
                class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white
                hover:bg-red bg-red-600 transition">
                &cross;
              </button>
            </div>

            {#if editing === index}
              <input
                value={item.description}
                id="edit"
                class="edit"
                on:keydown={handleEdit}
                on:blur={submit}
                autofocus />
            {/if}
          </li>
        {/each}
      </ul>

      <footer class="">
        <span class="">
          <strong>{numActive}</strong>
          {numActive === 1 ? 'item' : 'todos'} left
        </span>

        <ul class="text-gray-900 mt-2 ml-8">
          <li>
            <a class={currentFilter === 'all' ? 'shadow border border-teal-500' : ''} href="#/">
              All
            </a>
          </li>
          <li>
            <a
              class={currentFilter === 'active' ? 'shadow border border-teal-500' : ''}
              href="#/active">
              <i class="underline">Active</i>
            </a>
          </li>
          <li>
            <a
              class={currentFilter === 'completed' ? 'shadow border border-teal-500' : ''}
              href="#/completed">
              <i class="line-through">Completed</i>
            </a>
          </li>
        </ul>

        {#if numCompleted}
          <button
            class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white
            hover:bg-red bg-red-600"
            on:click={clearCompleted}>
            Clear completed &cross;
          </button>
        {/if}
      </footer>
    </section>
  {/if}

{/await}

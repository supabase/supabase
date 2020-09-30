<script>
  import Item from './Item.svelte'
  import { addTask, updateTask, createList, fetchList } from './store'
  export let items
  export let currentFilter
  export let editing
  function clearCompleted() {
    todos = todos.filter(item => !item.complete)
  }
  function handleEdit(event) {
    if (event.which === ENTER_KEY) event.target.blur()
    else if (event.which === ESCAPE_KEY) editing = null
  }
  function submit(event) {
    updateTask(editing, event.target.value)
    editing = null
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
  $: filtered =
    currentFilter === 'all'
      ? items
      : currentFilter === 'completed'
      ? items.filter(item => item.complete)
      : items.filter(item => !item.complete)
  $: numActive = items ? items.filter(item => !item.complete).length : 0
  $: numCompleted = items ? items.filter(item => item.complete).length : 0
</script>

<section class="container bg-white rounded shadow p-6 m-4 w-full lg:w-3/4 lg:max-w-lg">
  <input
    id="toggle-all"
    class="inline-block mr-4"
    type="checkbox"
    on:change={toggleAll}
    checked={numCompleted === items.length} />
  <label for="toggle-all">Mark all as complete</label>

  <ul class="mx-0 list-none bg-clip-padding">
    {#each filtered as item, index (item.id)}
      <Item {item} {index} {editing} />
    {/each}
  </ul>

  <footer class="">
    <span class="">
      <strong>{numActive}</strong>
      {numActive === 1 ? 'item' : 'todos'} left
    </span>

    <ul class="text-gray-900 mt-2 ml-8">
      <li>
        <a class={currentFilter === 'all' ? 'shadow border border-teal-500' : ''} href="#/">All</a>
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
  Filtered
  <pre>{JSON.stringify(filtered)}</pre>
</section>

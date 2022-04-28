<script>
  import { createEventDispatcher } from 'svelte'
  import { addTask, deleteTask, updateTask, createList, fetchList } from './store'
  export let item
  export let editing
  export let index
  export let list_id
  // export let items
  const dispatch = createEventDispatcher()
  const ENTER_KEY = 13
  const ESCAPE_KEY = 27
  function handleEdit(event) {
    if (event.which === ENTER_KEY) event.target.blur()
    else if (event.which === ESCAPE_KEY) editing = null
  }
  function markComplete(event) {
    updateTask(item.id, { complete: !item.complete })
  }
  function submit(event) {
    updateTask(editing, event.target.value)
    editing = null
  }
</script>

<li
  class="{item.complete ? 'line-through' : 'underline'}
  {editing === index ? 'editing' : ''} py-6 px-2 border-b bol border-grey-darkest flex
  justify-between todos-center relative todo__item"
>
  <div class="view">
    <input
      on:click="{markComplete}"
      class="inline-block mr-4"
      type="checkbox"
      bind:checked="{item.complete}"
    />
    <label on:dblclick="{() => (editing = index)}" class="">{item.task_text}</label>
    <button
      on:click="{() => dispatch('remove')}"
      class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white
      hover:bg-red bg-red-600 transition"
    >
      &cross;
    </button>
  </div>

  {#if editing === index}
    <input
      value="{item.task_text}"
      id="edit"
      class="edit"
      on:keydown="{handleEdit}"
      on:blur="{submit}"
      autofocus
    />
  {/if}
</li>
<slot />

<script>
  import { addTask, updateTask, createList, fetchList } from './store'
export let item
export let editing
export let index
</script>
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
<slot/>

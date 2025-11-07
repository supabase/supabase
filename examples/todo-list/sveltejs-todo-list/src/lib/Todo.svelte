<script lang="ts">
  import { supabase } from "./db";

  export let todo;
  export let onDelete = () => {};

  let isCompleted = todo.is_complete;

  const toggle = async () => {
    try {
      const { data, error } = await supabase
        .from("todos")
        .update({ is_complete: !isCompleted })
        .eq("id", todo.id)
        .select("is_complete")
        .single();
      if (error) {
        throw error;
      }
      isCompleted = data.is_complete;
    } catch (error) {
      console.log("error", error);
    }
  };
</script>

<li
  class="w-full block cursor-pointer hover:bg-200 focus:outline-none focus:bg-200 transition duration-150 ease-in-out"
>
  <div class="flex items-center px-4 py-4 sm:px-6">
    <div class="min-w-0 flex-1 flex items-center">
      <div class="text-sm leading-5 font-medium truncate">{todo.task}</div>
    </div>
    <div>
      <input
        class="cursor-pointer"
        type="checkbox"
        on:change={toggle}
        bind:checked={isCompleted}
      />
    </div>
    <button
      on:click={onDelete}
      class="w-4 h-4 ml-2 border-2 hover:border-black rounded"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="gray">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</li>

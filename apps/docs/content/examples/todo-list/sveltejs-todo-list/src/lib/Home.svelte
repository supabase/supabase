<script>
  import { supabase } from "./db";
  import TodoList from "./TodoList.svelte";

  export let user;
</script>

<div
  class="w-full h-full flex flex-col justify-center items-center p-4"
  style="min-width: 250px; max-width: 600px; margin: auto;"
>
  <TodoList {user} />
  <button
    class="btn-black w-full mt-12"
    on:click={async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.log("Error logging out:", error.message);
    }}
  >
    Logout
  </button>
</div>

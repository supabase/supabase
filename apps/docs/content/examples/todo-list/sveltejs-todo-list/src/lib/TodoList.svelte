<script lang="ts">
  import type { User } from "@supabase/supabase-js";
  import Todo from "./Todo.svelte";
  import { supabase } from "./db";
  import Alert from "./Alert.svelte";
  import { onMount } from "svelte";

  export let user: User;

  let todos = [];
  let newTaskText = "";
  let errorText = "";

  onMount(() => {
    fetchTodos();
  });

  const fetchTodos = async () => {
    let { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("id", { ascending: true });
    if (error) {
      console.log("error", error);
    } else {
      todos = data;
    }
  };

  const addTodo = async (taskText: string) => {
    let task = taskText.trim();
    if (task.length) {
      let { data: todo, error } = await supabase
        .from("todos")
        .insert({ task, user_id: user.id })
        .select()
        .single();

      if (error) {
        errorText = error.message;
      } else {
        todos = [...todos, todo];
        newTaskText = "";
      }
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await supabase.from("todos").delete().eq("id", id);
      todos = todos.filter((x) => x.id != id);
    } catch (error) {
      console.log("error", error);
    }
  };
</script>

<div class="w-full">
  <h1 class="mb-12">Todo List.</h1>
  <form
    on:submit|preventDefault={() => addTodo(newTaskText)}
    class="flex gap-2 my-2"
  >
    <input
      class="rounded w-full p-2"
      type="text"
      placeholder="make coffee"
      bind:value={newTaskText}
    />
    <button type="submit" class="btn-black"> Add </button>
  </form>
  {#if !!errorText}
    <Alert text={errorText} />
  {/if}
  <div class="bg-white shadow overflow-hidden rounded-md">
    <ul>
      {#each todos as todo (todo.id)}
        <Todo {todo} onDelete={() => deleteTodo(todo.id)} />
      {/each}
    </ul>
  </div>
</div>

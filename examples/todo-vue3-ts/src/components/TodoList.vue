<template>
  <div class="w-full">
    <h1 class="mb-12 font-bold text-6xl">Todo List.</h1>
    <div class="flex gap-2 my-2">
      <input class="rounded w-full p-2" type="text" placeholder="What do you need to?" />
      <button class="btn-black">
        Add
      </button>
    </div>

    <div class="bg-white shadow overflow-hidden rounded-md">
      <ul v-for="(todo, index) in allTodos" :key="index">
        <Todo :todo="todo" />
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Todo from '@/components/Todo.vue'
import { allTodos, fetchTodos } from '@/vuetils/useTodo'

export default defineComponent({
  name: 'TodoList',
  components: {
    Todo,
  },

  async setup() {
    await fetchTodos()

    return {
      allTodos,
    }
  },
})
</script>

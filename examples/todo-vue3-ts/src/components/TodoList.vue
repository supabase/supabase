<template>
  <div class="w-full">
    <h1 class="mb-12 font-bold text-6xl">Todo List.</h1>
    <div class="flex gap-2 my-2">
      <input
        class="rounded w-full p-2"
        type="text"
        placeholder="make coffee"
        value="{newTaskText}"
      />
      <button class="btn-black">
        Add
      </button>
    </div>

    <div class="bg-white shadow overflow-hidden rounded-md">
      <ul>
        <!-- for loop around a todo component -->
        <Todo />
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Todo from '@/components/Todo.vue'

export default defineComponent({
  name: 'TodoList',
  components: {
    Todo,
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>

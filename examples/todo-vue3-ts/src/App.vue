<template>
  <div id="app" class="w-full h-full bg-gray-300">
    <div v-if="false" class="w-full h-full flex justify-center items-center p-4">
      <Auth />
    </div>
    <div v-else class="w-full h-full flex flex-col justify-center items-center p-4 max-w-sm m-auto">
      <TodoList />
    </div>
  </div>
</template>

<script>
import Auth from '@/components/Auth.vue'
import TodoList from '@/components/TodoList.vue'
export default {
  components: {
    Auth,
    TodoList,
  },
  setup() {
    return {}
  },
}
</script>

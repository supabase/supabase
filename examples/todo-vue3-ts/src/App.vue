<template>
  <div id="app" class="w-full h-full bg-gray-300">
    <div v-if="userSession === null" class="w-full h-full flex justify-center items-center p-4">
      <Auth />
    </div>
    <div v-else class="w-full h-full flex flex-col justify-center items-center p-4 max-w-sm m-auto">
      <TodoList />
      <button class="btn-black w-full mt-12" @click="logout">
        Logout
      </button>
    </div>
  </div>
</template>

<script>
import Auth from '@/components/Auth.vue'
import TodoList from '@/components/TodoList.vue'
import { userSession, logout } from '@/vuetils/useAuth'

export default {
  components: {
    Auth,
    TodoList,
  },
  setup() {
    return { userSession, logout }
  },
}
</script>

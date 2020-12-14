<template>
  <div id="app" class="w-full h-full flex flex-col justify-center bg-gray-300">
    <div
      v-if="userSession === null"
      class="w-full h-full flex flex-col justify-center items-center p-4"
    >
      <Auth />
    </div>
    <div v-else class="w-full h-full flex flex-col justify-center items-center p-4 max-w-sm m-auto">
      <Suspense>
        <template #default>
          <div>
            <TodoList />
            <button class="btn-black w-full mt-12" @click="handleLogout">
              Logout
            </button>
          </div>
        </template>
        <template #fallback>
          <Loading />
        </template>
      </Suspense>
    </div>
    <Footer />
  </div>
</template>

<script>
import Auth from '@/components/Auth.vue'
import TodoList from '@/components/TodoList.vue'
import Loading from '@/components/Loading.vue'
import Footer from '@/components/Footer.vue'
import { userSession, handleLogout } from '@/vuetils/useAuth'

export default {
  components: {
    Auth,
    TodoList,
    Loading,
    Footer,
  },
  setup() {
    // Get the auth token in the local storage.
    const json = localStorage.getItem('supabase.auth.token')
    if (json) {
      const data = JSON.parse(json)    
      const { currentSession, expiresAt } = data
      const timeNow = Math.round(Date.now() / 1000)
      // If it hasn't expired yet, update userSession.
      if (timeNow < expiresAt) {
        userSession.value = currentSession
      }
    }
    // NOTE: The pattern above is similar to that of the _recoverSession() function
    // in supabase/gotrue-js: https://github.com/supabase/gotrue-js/blob/dc6cf10dcac016ba4831efdb9b8683bda109dab0/src/GoTrueClient.ts#L328
    return { userSession, handleLogout }
  },
}
</script>

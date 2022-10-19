<template>
  <main class="w-full sm:w-1/2 xl:w-1/3">
    <div class="border-teal p-8 border-t-12 mb-6 rounded-lg shadow-lg bg-white">
      <div class="mb-4">
        <label class="font-bold text-grey-darker block mb-2">Password</label>
        <input
          type="password"
          class="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
          placeholder="Your password"
          v-model="password"
        />
      </div>

      <div class="flex flex-col gap-2">
        <a @click="handleUpdateUser({ password: password })" href="#" class="btn-black" tabindex="0">
          Update password
        </a>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { handleUpdateUser } from '@/vuetils/useAuth'

export default defineComponent({
  name: 'Auth',

  setup() {
    const password = ref('')

    return {
      password,
      handleUpdateUser,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>

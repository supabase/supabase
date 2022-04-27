<template>
  <main class="w-full sm:w-1/2 xl:w-1/3">
    <div class="border-teal p-8 border-t-12 mb-6 rounded-lg shadow-lg bg-white">
      <div class="mb-4">
        <label class="font-bold text-grey-darker block mb-2">Email</label>
        <input
          type="text"
          class="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
          placeholder="Your email"
          v-model="email"
        />
      </div>
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
        <a @click="handleSignup({ email, password })" href="#" class="btn-black" tabindex="0">
          Sign up
        </a>
        <a @click="handleLogin({ email, password })" href="#" class="btn-black-outline">
          <span v-if="password.length">Sign in</span>
          <span v-else> Send magic link </span>
        </a>
      </div>

      <div class="mt-2 text-sm leading-5">
        <a
          @click.prevent="handlePasswordReset"
          href="/"
          class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150"
        >
          Forgot your password?
        </a>
      </div>

      <div class="mt-4">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm leading-5">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div class="mt-6">
          <div class="mt-6">
            <span class="block w-full rounded-md shadow-sm">
              <button
                @click="handleOAuthLogin('github')"
                type="button"
                class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out"
              >
                GitHub
              </button>
            </span>
          </div>
          <div class="mt-6">
            <span class="block w-full rounded-md shadow-sm">
              <button
                @click="handleOAuthLogin('google')"
                type="button"
                class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out"
              >
                Google
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { handleLogin, handleOAuthLogin, handleSignup, handlePasswordReset } from '@/vuetils/useAuth'

export default defineComponent({
  name: 'Auth',

  setup() {
    const email = ref('')
    const password = ref('')

    return {
      email,
      password,
      handleLogin,
      handleOAuthLogin,
      handleSignup,
      handlePasswordReset,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>

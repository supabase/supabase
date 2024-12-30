<script lang="ts">
  import type { Provider } from "@supabase/supabase-js";
  import { supabase } from "./db";

  interface HelperText {
    error: boolean;
    text: string | null;
  }

  let email: string = "";
  let password: string = "";
  let helperText: HelperText = { error: null, text: null };

  const handleLogin = async (type) => {
    const {
      data: { user },
      error,
    } =
      type === "LOGIN"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      helperText = { error: true, text: error.message };
    } else if (!user && !error) {
      helperText = {
        error: false,
        text: "An email has been sent to you for verification!",
      };
    }
  };

  const handleOAuthLogin = async (provider: Provider) => {
    // You need to enable the third party auth you want in Authentication > Settings
    // Read more on: https://supabase.com/docs/guides/auth#third-party-logins
    let { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) console.log("Error: ", error.message);
  };
</script>

<div
  class="w-full h-full sm:h-auto sm:w-2/5 max-w-sm p-5 bg-white shadow flex flex-col text-base"
>
  <span
    class="font-sans text-4xl text-center pb-2 mb-1 border-b mx-4 align-center"
  >
    Login
  </span>
  <label class="mt-3 mb-2 font-medium text-lg" for="email">
    <span class="font-mono mr-1 text-red-400">*</span>Email:
  </label>
  <input
    id="email"
    class="bg-gray-100 border py-1 px-3"
    type="email"
    name="email"
    bind:value={email}
    required
  />
  <label class="mt-3 mb-2 font-medium text-lg" for="password">
    <span class="font-mono mr-1 text-red-400">*</span>Password:
  </label>
  <input
    id="password"
    class="bg-gray-100 border py-1 px-3"
    type="password"
    name="password"
    bind:value={password}
    required
  />
  {#if !!helperText.text}
    <div
      class="border px-1 py-2 my-2 text-center text-sm {helperText.error
        ? 'bg-red-100 border-red-300 text-red-400'
        : 'bg-green-100 border-green-300 text-green-500'}"
    >
      {helperText.text}
    </div>
  {/if}
  <div class="mt-2 flex">
    <span class="block mx-1.5 w-full rounded-md shadow-sm">
      <button
        type="submit"
        on:click={() => handleLogin("REGISTER")}
        class="border w-full border-blue-600 text-blue-600 flex justify-center py-2 px-4 text-sm font-medium rounded-md hover:bg-blue-200 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
      >
        Sign Up
      </button>
    </span>
    <span class="block w-full mx-1.5 rounded-md shadow-sm">
      <button
        on:click={() => handleLogin("LOGIN")}
        type="button"
        class="flex w-full justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
      >
        Sign In
      </button>
    </span>
  </div>
  <div class="mt-3">
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full mx-1.5 border-t border-gray-300" />
      </div>
      <div class="relative flex justify-center text-sm leading-5">
        <span class="px-2 bg-white text-gray-500"> Or continue with </span>
      </div>
    </div>

    <div>
      <div class="mt-3">
        <span class="block rounded-md shadow-sm">
          <button
            on:click={() => handleOAuthLogin("github")}
            type="button"
            class="w-3/4 mx-auto flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
          >
            GitHub
          </button>
        </span>
      </div>
      <div class="mt-3">
        <span class="block rounded-md shadow-sm">
          <button
            on:click={() => handleOAuthLogin("google")}
            type="button"
            class="w-3/4 mx-auto flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
          >
            Google
          </button>
        </span>
      </div>
    </div>
  </div>
</div>

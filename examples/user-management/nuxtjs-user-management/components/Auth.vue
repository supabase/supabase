<template>
  <div class="row">
    <div class="col-6">
      <h1 class="header">Supabase Auth + Storage</h1>
      <p className="">
        Experience our Auth and Storage through a simple profile management example. Create a user
        profile and upload an avatar image. Fast, simple, secure.
      </p>
    </div>
    <form class="col-6 auth-widget" @submit.prevent="handleSubmit">
      <p class="description">Sign in via magic link with your email below</p>
      <div>
        <label for="email-register">Email</label>
        <input
          class="inputField"
          v-model="formValues.email"
          id="email-register"
          type="email"
          placeholder="Your email"
        />
      </div>

      <div>
        <button class="button block" :disabled="formValues.loader">
          {{ formValues.loader ? "Loading ..." : "Sign up with magic link" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { supabase } from "../lib/supabaseClient";

export default {
  data() {
    return {
      formValues: {
        email: "",
        loader: false,
      },
    };
  },
  methods: {
    async handleSubmit() {
      try {
        this.formValues.loader = true;
        const { error, data: { user } } = await supabase.auth.signInWithOtp({
          email: this.formValues.email,
        });

        if (error) {
          throw error;
        }

        alert("Check your email for the login link!");
      } catch (error) {
        alert(error.message);
      } finally {
        this.formValues.loader = false;
      }
    },
  },
};
</script>

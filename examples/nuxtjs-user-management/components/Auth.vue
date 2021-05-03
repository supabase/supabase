<template>
  <div>
    <form @submit.prevent="handleSubmit" class="auth-container">
      <div>
        <label for="email-register">Email</label>
        <input
          v-model="formValues.email"
          id="email-register"
          type="email"
          placeholder="Your email"
        />
      </div>

      <div style="margin-top: 50px">
        <button class="button block primary" :disabled="formValues.loader">
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
      console.log("ENV", process.env.NUXT_PUBLIC_SUPABASE_URL);
      try {
        this.formValues.loader = true;
        const { error, user } = await supabase.auth.signIn({
          email: this.formValues.email,
        });

        if (error) {
          throw error;
        }

        alert("Check your email for the login link!");
      } catch (error) {
        alert(error.error_description || error.message);
      } finally {
        this.formValues.loader = false;
      }
    },
  },
};
</script>

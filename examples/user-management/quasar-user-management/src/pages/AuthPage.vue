<script setup>
import { ref } from 'vue';
import { supabase } from 'boot/supabase';

const loading = ref(false);
const email = ref('');

const handleLogin = async () => {
  try {
    loading.value = true;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
    });
    if (error) throw error;
    alert('Check your email for the login link!');
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <form class="q-pa-md column flex-center flex" @submit.prevent="handleLogin">
    <q-card class="col-6 form-widget">
      <q-card-section class="q-gutter-md">
        <div class="text-h1">Supabase + Quasar</div>
        <div>Sign in via magic link with your email below</div>
        <q-input
          lazy-rules
          :rules="[
            (val, rules) =>
              rules.email(val) || 'Please enter a valid email address',
          ]"
          type="email"
          label="Your email"
          v-model="email"
        />
      </q-card-section>
      <q-card-actions class="q-gutter-md">
        <q-btn
          type="submit"
          color="primary"
          :label="loading ? 'Loading' : 'Send magic link'"
          :disabled="loading"
        />
      </q-card-actions>
    </q-card>
  </form>
</template>

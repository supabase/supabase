<script setup>
import { onMounted, ref } from 'vue'
import Account from './components/Account.vue'
import Auth from './components/Auth.vue'
import { supabase } from './supabase'

const claims = ref()

onMounted(() => {
  supabase.auth.getClaims().then(({ data }) => {
    claims.value = data.claims
  })

  supabase.auth.onAuthStateChange(async () => {
    const { data } = await supabase.auth.getClaims()
    claims.value = data.claims
  })
})
</script>

<template>
  <div class="container" style="padding: 50px 0 100px 0">
    <Account v-if="claims" :claims="claims" />
    <Auth v-else />
  </div>
</template>
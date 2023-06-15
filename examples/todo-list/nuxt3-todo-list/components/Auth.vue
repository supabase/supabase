<template>
  <UCard class="login-card">
    <div v-if="!supUser" class="login">
      <UInput placeholder="Your Email address" v-model="email"></UInput>
      <UButton @click="handleLogin">Send Magic Link</UButton>
    </div>
    <div v-else class="logout">
      <div>{{ supUser.email }}</div>
      <div>
        <UButton @click="handleLogout">Logout</UButton>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.login-card {
  display: flex;
  flex-direction: column;
}
.login {
}
.logout {
  display: flex;
  flex-direction: column;
}

</style>

<script lang="ts" setup>
  const supabase = useSupabaseAuthClient()
  const email = ref('')
  const supUser = ref()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: 'http://localhost:3000'
      }
    })
    if (error) {
      alert(error.message)
    }
    alert('Check your email inbox for the magic link!')
  }
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      alert(error.message)
    }
    supUser.value = null
  }
  const loadUser = async () => {
    const { data, error } = await supabase.auth.getUser()
    supUser.value = data.user
  }
  await loadUser()
</script>
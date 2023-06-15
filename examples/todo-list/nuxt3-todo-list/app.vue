<template>
  <UContainer class="app-container">
    <TodoListManager></TodoListManager>
  </UContainer>
  <UNotifications />  
</template>

<script lang="ts" setup>
  const supabase = useSupabaseAuthClient()
  const supUser = ref()
  const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      supUser.value = data.session?.user
  }

  await loadSession()
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  align-items: stretch;
  height: 100vh;
  width: 100vw;
  gap: 1rem;
}

.app-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-grow: 2;
}
</style>
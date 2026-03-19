<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { createClient } from "@/lib/supabase/client"

const router = useRouter()
const supabase = createClient()
const email = ref<string | null>(null)
const loading = ref(true)

onMounted(async () => {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    router.replace("/auth/login")
    return
  }

  email.value = data.user.email
  loading.value = false
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.replace("/auth/login")
}
</script>

<template>
  <div class="flex h-screen w-full items-center justify-center">
    <div v-if="loading" class="text-muted-foreground">Checking authentication...</div>

    <div v-else class="flex items-center gap-2">
      <p>
        Hello <span class="font-semibold">{{ email }}</span>
      </p>
      <button
        class="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90"
        @click="handleLogout"
      >
        Logout
      </button>
    </div>
  </div>
</template>

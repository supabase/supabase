<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { createClient } from "@/lib/supabase/client"
import LogoutButton from "@/components/logout-button.vue"

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
</script>

<template>
  <div class="flex h-screen w-full items-center justify-center">
    <div v-if="loading" class="text-muted-foreground">Checking authentication...</div>

    <div v-else class="flex items-center gap-2">
      <p>
        Hello <span class="font-semibold">{{ email }}</span>
      </p>
      <LogoutButton />
    </div>
  </div>
</template>

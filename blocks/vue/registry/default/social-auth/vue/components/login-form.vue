<script setup lang="ts">
import { ref } from "vue"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const error = ref<string | null>(null)
const isLoading = ref(false)

const handleSocialLogin = async (e: Event) => {
  e.preventDefault()
  const supabase = createClient()
  isLoading.value = true
  error.value = null

  try {
    const { error: supabaseError } = await supabase.auth.signInWithOAuth({
      provider: "github",
    })

    if (supabaseError) throw supabaseError
    window.location.href = "/protected"
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "An error occurred"
    isLoading.value = false
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6')">
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Welcome!</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit="handleSocialLogin">
          <div class="flex flex-col gap-6">
            <p v-if="error" class="text-sm text-destructive-500">{{ error }}</p>
            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? "Logging in..." : "Continue with GitHub" }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

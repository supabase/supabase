<script setup lang="ts">
import { ref } from "vue"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const password = ref("")
const error = ref<string | null>(null)
const isLoading = ref(false)

const handleUpdatePassword = async () => {
  const supabase = createClient()
  isLoading.value = true
  error.value = null

  try {
    const { error: supabaseError } = await supabase.auth.updateUser({
      password: password.value,
    })
    if (supabaseError) throw supabaseError
    // Redirect user after successful password update
    location.href = "/protected"
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "An error occurred"
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>Please enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleUpdatePassword">
          <div class="flex flex-col gap-6">
            <div class="grid gap-2">
              <Label for="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="New password"
                required
                v-model="password"
              />
            </div>
            <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? "Saving..." : "Save new password" }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

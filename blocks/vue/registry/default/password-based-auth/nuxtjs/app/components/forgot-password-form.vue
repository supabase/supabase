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


const email = ref("")
const error = ref<string | null>(null)
const success = ref(false)
const isLoading = ref(false)

const handleForgotPassword = async (e: Event) => {
  e.preventDefault()
  const supabase = createClient()
  isLoading.value = true
  error.value = null

  try {
    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: "http://localhost:3000/update-password",
    })
    if (supabaseError) throw supabaseError
    success.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "An error occurred"
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card v-if="success">
      <CardHeader>
        <CardTitle class="text-2xl">Check Your Email</CardTitle>
        <CardDescription>Password reset instructions sent</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          If you registered using your email and password, you will receive a password reset email.
        </p>
      </CardContent>
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle class="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>
          Type in your email and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit="handleForgotPassword">
          <div class="flex flex-col gap-6">
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                v-model="email"
              />
            </div>
            <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? "Sending..." : "Send reset email" }}
            </Button>
          </div>
          <div class="mt-4 text-center text-sm">
            Already have an account?
            <a href="/login" class="underline underline-offset-4">Login</a>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

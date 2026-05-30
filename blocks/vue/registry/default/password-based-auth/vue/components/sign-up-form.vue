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
const password = ref("")
const repeatPassword = ref("")
const error = ref<string | null>(null)
const isLoading = ref(false)
const success = ref(false)

const handleSignUp = async () => {
  const supabase = createClient()
  error.value = null

  if (password.value !== repeatPassword.value) {
    error.value = "Passwords do not match"
    return
  }

  isLoading.value = true
  try {
    const { error: supabaseError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
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
        <CardTitle class="text-2xl">Thank you for signing up!</CardTitle>
        <CardDescription>Check your email to confirm</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          You've successfully signed up. Please check your email to confirm your account before
          signing in.
        </p>
      </CardContent>
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle class="text-2xl">Sign up</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSignUp">
          <div class="flex flex-col gap-6">
            <!-- Email -->
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

            <!-- Password -->
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label for="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                v-model="password"
              />
            </div>

            <!-- Repeat Password -->
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label for="repeat-password">Repeat Password</Label>
              </div>
              <Input
                id="repeat-password"
                type="password"
                required
                v-model="repeatPassword"
              />
            </div>

            <!-- Error -->
            <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

            <!-- Submit -->
            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? "Creating an account..." : "Sign up" }}
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

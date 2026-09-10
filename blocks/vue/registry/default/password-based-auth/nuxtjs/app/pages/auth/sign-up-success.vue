<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
</script>

<template>
  <div class="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <div class="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">Thank you for signing up!</CardTitle>
            <CardDescription>Check your email to confirm</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              You’ve successfully signed up. Please check your email to confirm your account
              before signing in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

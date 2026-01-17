<script setup lang="ts">
import { useRoute } from "vue-router"
import { computed } from "vue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const route = useRoute()
const errorMessage = computed(() => route.query.error as string || null)
</script>

<template>
  <div class="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <div class="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">Sorry, something went wrong.</CardTitle>
          </CardHeader>
          <CardContent>
            <p v-if="errorMessage" class="text-sm text-muted-foreground">
              Code error: {{ errorMessage }}
            </p>
            <p v-else class="text-sm text-muted-foreground">
              An unspecified error occurred.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
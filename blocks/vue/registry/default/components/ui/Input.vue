<script setup lang="ts">
import { cn } from "../../lib/utils"

defineProps<{
  type?: string
  class?: string
}>()

const props = defineProps({
  type: { type: String, default: "text" },
  class: { type: String, default: "" },
})
</script>

<template>
  <input
    :type="props.type"
    :class="
      cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        props.class
      )
    "
  />
</template>

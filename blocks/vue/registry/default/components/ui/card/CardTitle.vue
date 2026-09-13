<script setup lang="ts">
import { cn } from "../../../lib/utils"

defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('font-semibold leading-none tracking-tight', $props.class)">
    <slot />
  </div>
</template>

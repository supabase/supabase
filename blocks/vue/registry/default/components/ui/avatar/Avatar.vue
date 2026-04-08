<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <div
    :class="[
      'relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full',
      $props.class,
    ]"
  >
    <slot />
  </div>
</template>

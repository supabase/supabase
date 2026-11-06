<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <div
    :class="[
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      $props.class,
    ]"
  >
    <slot />
  </div>
</template>
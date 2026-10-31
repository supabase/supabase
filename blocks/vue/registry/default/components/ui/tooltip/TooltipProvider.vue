<script setup lang="ts">
import { provide, ref } from 'vue'

const delayDuration = ref(0)

provide('tooltipDelay', delayDuration)
</script>

<template>
  <slot />
</template>

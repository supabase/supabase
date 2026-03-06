<script setup lang="ts">
import { provide, ref } from 'vue'

const open = ref(false)

provide('tooltipOpen', open)
</script>

<template>
  <slot />
</template>

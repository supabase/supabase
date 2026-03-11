<script setup lang="ts">
import { inject, Ref } from 'vue'

const open = inject<Ref<boolean>>('tooltipOpen')

function show() {
  open.value = true
}

function hide() {
  open.value = false
}
</script>

<template>
  <span @mouseenter="show" @mouseleave="hide">
    <slot />
  </span>
</template>

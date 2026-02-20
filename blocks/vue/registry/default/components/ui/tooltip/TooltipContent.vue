<script setup lang="ts">
import { inject, computed, Ref } from 'vue'

const props = defineProps<{
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  class?: string
}>()

const open = inject<Ref<boolean>>('tooltipOpen')

const positionClasses = computed(() => {
  switch (props.side) {
    case 'top':
      return `bottom-full mb-${props.sideOffset ?? 4}`
    case 'bottom':
      return `top-full mt-${props.sideOffset ?? 4}`
    case 'left':
      return `right-full mr-${props.sideOffset ?? 4}`
    case 'right':
      return `left-full ml-${props.sideOffset ?? 4}`
    default:
      return `top-full mt-${props.sideOffset ?? 4}`
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      :class="[
        'z-50 absolute rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground',
        'animate-in fade-in-0 zoom-in-95',
        positionClasses,
        props.class,
      ]"
    >
      <slot />
    </div>
  </Teleport>
</template>

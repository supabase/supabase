<script setup lang="ts">
import { inject, computed, Ref } from 'vue'

const props = defineProps<{
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  class?: string
}>()

const open = inject<Ref<boolean>>('tooltipOpen')

const positionClasses = computed(() => {
  const offset = props.sideOffset ?? 2
  switch (props.side) {
    case 'top':
      return 'bottom-full mb-2'
    case 'bottom':
      return 'top-full mt-2'
    case 'left':
      return 'right-full mr-2'
    case 'right':
      return 'left-full ml-2'
    default:
      return 'top-full mt-2'
  }
})

const positionStyle = computed(() => {
  const offset = props.sideOffset ?? 4
  const allowedOffsets = [2, 4, 8]
  if (allowedOffsets.includes(offset)) return {}
  switch (props.side) {
    case 'top':
      return { marginBottom: `${offset}px` }
    case 'bottom':
      return { marginTop: `${offset}px` }
    case 'left':
      return { marginRight: `${offset}px` }
    case 'right':
      return { marginLeft: `${offset}px` }
    default:
      return { marginTop: `${offset}px` }
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
      :style="positionStyle"
    >
      <slot />
    </div>
  </Teleport>
</template>

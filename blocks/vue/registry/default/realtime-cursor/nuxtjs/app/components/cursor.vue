<script setup lang="ts">
import { MousePointer2 } from 'lucide-vue-next'
import type { CSSProperties } from 'vue'
// @ts-ignore
import { cn } from '@/lib/utils'

defineProps<{
  className?: string
  style?: CSSProperties
  color: string
  name: string
}>()
</script>

<template>
  <div
    :class="cn('pointer-events-none', className)"
    :style="style"
  >
    <MousePointer2
      :color="color"
      :fill="color"
      :size="30"
    />

    <div
      class="mt-1 px-2 py-1 rounded text-xs font-bold text-white text-center"
      :style="{ backgroundColor: color }"
    >
      {{ name }}
    </div>
  </div>
</template>

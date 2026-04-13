<script setup lang="ts">
  // @ts-ignore
import { Cursor } from '@/components/cursor'
// @ts-ignore
import { useRealtimeCursors } from '@/composables/useRealtimeCursors'

const THROTTLE_MS = 50

const props = defineProps<{
  roomName: string
  username: string
}>()

const { cursors } = useRealtimeCursors({
  roomName: props.roomName,
  username: props.username,
  throttleMs: THROTTLE_MS,
})
</script>

<template>
  <div>
    <Cursor
      v-for="(cursor, id) in cursors"
      :key="id"
      className="fixed transition-transform ease-in-out z-50"
      :style="{
        transitionDuration: '20ms',
        top: '0px',
        left: '0px',
        transform: `translate(${cursor.position.x}px, ${cursor.position.y}px)`,
      }"
      :color="cursor.color"
      :name="cursor.user.name"
    />
  </div>
</template>

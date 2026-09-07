<script setup lang="ts">
import { computed } from 'vue'
// @ts-ignore
import { useCurrentUserImage } from '@/composables/useCurrentUserImage'
// @ts-ignore
import { useCurrentUserName } from '@/composables/useCurrentUserName'

import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarFallback from '@/components/ui/avatar/AvatarFallback.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'

const { image: profileImage } = useCurrentUserImage()
const { name } = useCurrentUserName()

const initials = computed(() => {
  if (!name.value) return ''
  return name.value
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
})
</script>

<template>
  <Avatar>
    <AvatarImage
      v-if="profileImage"
      :src="profileImage"
      :alt="initials"
    />
    <AvatarFallback>
      {{ initials }}
    </AvatarFallback>
  </Avatar>
</template>

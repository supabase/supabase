<script setup lang="ts">
import { computed } from 'vue'

import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'
import AvatarFallback from '@/components/ui/avatar/AvatarFallback.vue'

import Tooltip from '@/components/ui/tooltip/Tooltip.vue'
import TooltipContent from '@/components/ui/tooltip/TooltipContent.vue'
import TooltipTrigger from '@/components/ui/tooltip/TooltipTrigger.vue'

interface AvatarItem {
  name: string
  image: string
}

const props = defineProps<{
  avatars: AvatarItem[]
  orientation?: 'vertical' | 'horizontal'
  maxAvatarsAmount?: number
  class?: string
}>()

const orientation = computed(() => props.orientation ?? 'vertical')
const maxAvatarsAmount = computed(() => props.maxAvatarsAmount ?? 3)

const shownAvatars = computed(() =>
  props.avatars.slice(0, maxAvatarsAmount.value)
)

const hiddenAvatars = computed(() =>
  props.avatars.slice(maxAvatarsAmount.value)
)

const containerClasses = computed(() => [
  'flex -space-x-4 -space-y-4',
  orientation.value === 'vertical' ? 'flex-row -space-y-0' : 'flex-col -space-x-0',
  props.class,
])

function getInitials(name: string) {
  return name
    ?.split(' ')
    ?.map(word => word[0])
    ?.join('')
    ?.toUpperCase()
}
</script>

<template>
  <div :class="containerClasses">
    <!-- Visible avatars -->
    <Tooltip
      v-for="({ name, image }, index) in shownAvatars"
      :key="`${name}-${image}-${index}`"
    >
      <TooltipTrigger>
        <Avatar class="hover:z-10">
          <AvatarImage :src="image" />
          <AvatarFallback>
            {{ getInitials(name) }}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>

      <TooltipContent>
        <p>{{ name }}</p>
      </TooltipContent>
    </Tooltip>

    <!-- Hidden avatars -->
    <Tooltip v-if="hiddenAvatars.length">
      <TooltipTrigger>
        <Avatar>
          <AvatarFallback>
            +{{ avatars.length - shownAvatars.length }}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>

      <TooltipContent>
        <p
          v-for="({ name }, index) in hiddenAvatars"
          :key="`${name}-${index}`"
        >
          {{ name }}
        </p>
      </TooltipContent>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
// @ts-ignore
import { useUserProfile } from '@/composables/useUserProfile'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarFallback from '@/components/ui/avatar/AvatarFallback.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'

import { Camera, Globe, Loader2, User, Check, AlertCircle } from 'lucide-vue-next'

const {
  profile,
  loading,
  saving,
  uploading,
  error,
  success,
  updateProfile,
  uploadAvatar,
} = useUserProfile()

const fileInput = ref<HTMLInputElement | null>(null)

const initials = computed(() => {
  const name = profile.value.fullName
  if (!name) return '?'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadAvatar(file)
  }
}

const handleSubmit = async () => {
  await updateProfile({
    fullName: profile.value.fullName,
    username: profile.value.username,
    website: profile.value.website,
  })
}
</script>

<template>
  <div class="w-full max-w-lg mx-auto">
    <Card class="border border-border/40 bg-card/60 backdrop-blur-md shadow-2xl transition-all duration-300 hover:shadow-primary/5">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold tracking-tight text-foreground">Profile Settings</CardTitle>
        <CardDescription class="text-muted-foreground">
          Update your public profile details and avatar image
        </CardDescription>
      </CardHeader>
      
      <CardContent class="grid gap-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <p class="text-sm">Loading your profile...</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Avatar Section -->
          <div class="flex flex-col items-center gap-4">
            <div class="relative group cursor-pointer" @click="triggerFileInput">
              <Avatar class="h-24 w-24 border-2 border-primary/20 transition-all duration-300 group-hover:border-primary/60 shadow-lg">
                <AvatarImage 
                  v-if="profile.avatarUrl" 
                  :src="profile.avatarUrl" 
                  alt="Profile picture"
                  class="object-cover"
                />
                <AvatarFallback class="bg-primary/5 text-primary text-2xl font-semibold">
                  {{ initials }}
                </AvatarFallback>
              </Avatar>
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera v-if="!uploading" class="h-6 w-6 text-white" />
                <Loader2 v-else class="h-6 w-6 text-white animate-spin" />
              </div>
            </div>
            
            <input 
              ref="fileInput"
              type="file" 
              accept="image/*"
              class="hidden" 
              @change="handleFileChange"
              :disabled="uploading || saving"
            />
            
            <div class="text-center">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                @click="triggerFileInput"
                :disabled="uploading || saving"
                class="relative overflow-hidden"
              >
                {{ uploading ? 'Uploading...' : 'Change avatar' }}
              </Button>
              <p class="text-xs text-muted-foreground mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="space-y-4">
            <div class="grid gap-2">
              <Label for="fullName" class="text-sm font-medium">Display Name</Label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-muted-foreground">
                  <User class="h-4 w-4" />
                </span>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  v-model="profile.fullName"
                  class="pl-9 bg-background/50 focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div class="grid gap-2">
              <Label for="username" class="text-sm font-medium">Username</Label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-muted-foreground text-sm font-semibold select-none">
                  @
                </span>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  v-model="profile.username"
                  class="pl-8 bg-background/50 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div class="grid gap-2">
              <Label for="website" class="text-sm font-medium">Website</Label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-muted-foreground">
                  <Globe class="h-4 w-4" />
                </span>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  v-model="profile.website"
                  class="pl-9 bg-background/50 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          <!-- Message Alerts -->
          <Transition name="fade">
            <div v-if="success" class="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
              <Check class="h-4 w-4 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          </Transition>

          <Transition name="fade">
            <div v-if="error" class="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              <AlertCircle class="h-4 w-4 shrink-0" />
              <span>{{ error }}</span>
            </div>
          </Transition>

          <!-- Submit Button -->
          <Button 
            type="submit" 
            class="w-full shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 font-medium"
            :disabled="saving || uploading"
          >
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin mr-2" />
            {{ saving ? 'Saving Changes...' : 'Save Settings' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

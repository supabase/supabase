<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
import { store } from './store';
import { supabase } from './supabase';

async function syncUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  store.user = user;
}

onMounted(() => {
  syncUser();
});

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(() => {
  syncUser();
});

onUnmounted(() => {
  subscription.unsubscribe();
});
</script>

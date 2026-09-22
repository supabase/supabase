<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onUnmounted } from 'vue';
import router from './router';
import { supabase } from './supabase';

async function syncAuthRedirect() {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const path = router.currentRoute.value.path;

  if (claims && path === '/') {
    router.replace('/account');
  } else if (!claims && path === '/account') {
    router.replace('/');
  }
}

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(() => {
  syncAuthRedirect();
});

onUnmounted(() => {
  subscription.unsubscribe();
});
</script>

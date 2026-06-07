<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, useIonRouter } from '@ionic/vue';
import { onUnmounted } from 'vue';
import { store } from './store';
import { supabase } from './supabase';

const router = useIonRouter();

supabase.auth.getClaims().then(({ data: { claims } }) => {
  store.user = claims;
});

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, session) => {
  store.user = session?.user ?? null;
  if (session?.user) {
    router.replace('/account');
  } else {
    router.replace('/');
  }
});

onUnmounted(() => {
  subscription.unsubscribe();
});
</script>

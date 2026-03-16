<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, useIonRouter } from '@ionic/vue';
import { store } from './store';
import { supabase } from './supabase';

const router = useIonRouter();

supabase.auth.getUser().then(({ data: { user } }) => {
  store.user = user;
});

supabase.auth.onAuthStateChange((_event, session) => {
  store.user = session?.user ?? null;
  if (session?.user) {
    router.replace('/account');
  }
});
</script>

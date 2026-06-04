<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Account</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <avatar v-model:path="profile.avatar_url" @upload="updateProfile"></avatar>
      <form @submit.prevent="updateProfile">
        <ion-item>
          <ion-label>
            <p>Email</p>
            <p>{{ store.user?.email }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-input
            type="text"
            name="username"
            label="Name"
            label-placement="stacked"
            v-model="profile.username"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-input
            type="url"
            name="website"
            label="Website"
            label-placement="stacked"
            v-model="profile.website"
          ></ion-input>
        </ion-item>
        <div class="ion-text-center">
          <ion-button fill="clear" type="submit">Update Profile</ion-button>
        </div>
      </form>

      <div class="ion-text-center">
        <ion-button fill="clear" @click="signOut">Log Out</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { store } from '@/store';
import { supabase } from '@/supabase';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  toastController,
  loadingController,
  IonInput,
  IonItem,
  IonButton,
  IonLabel,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Avatar from '../components/Avatar.vue';

const router = useRouter();

const profile = ref({
  username: '',
  website: '',
  avatar_url: '',
});

async function getProfile() {
  const loader = await loadingController.create({});
  const toast = await toastController.create({ duration: 5000 });
  await loader.present();
  try {
    const { data: { claims } } = await supabase.auth.getClaims();
    if (!claims) throw new Error('No user logged in');

    const { data, error, status } = await supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', claims.sub)
      .single();

    if (error && status !== 406) throw error;

    if (data) {
      profile.value = {
        username: data.username,
        website: data.website,
        avatar_url: data.avatar_url,
      };
    }
  } catch (error: any) {
    toast.message = error.message;
    await toast.present();
  } finally {
    await loader.dismiss();
  }
}

const updateProfile = async () => {
  const loader = await loadingController.create({});
  const toast = await toastController.create({ duration: 5000 });
  try {
    await loader.present();
    const { data: { claims } } = await supabase.auth.getClaims();
    if (!claims) throw new Error('No user logged in');

    const updates = {
      id: claims.sub,
      ...profile.value,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) throw error;
  } catch (error: any) {
    toast.message = error.message;
    await toast.present();
  } finally {
    await loader.dismiss();
  }
};

async function signOut() {
  const loader = await loadingController.create({});
  const toast = await toastController.create({ duration: 5000 });
  await loader.present();
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await router.push('/');
  } catch (error: any) {
    toast.message = error.message;
    await toast.present();
  } finally {
    await loader.dismiss();
  }
}

onMounted(() => {
  getProfile();
});
</script>

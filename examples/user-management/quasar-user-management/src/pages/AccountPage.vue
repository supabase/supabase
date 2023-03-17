<script setup>
import { session, supabase } from 'boot/supabase';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AvatarUploader from 'components/AvatarUploader.vue';

const loading = ref(true);
const username = ref('');
const website = ref('');
const avatar_url = ref('');

const router = useRouter();

onMounted(() => {
  getProfile();
});

async function getProfile() {
  try {
    loading.value = true;
    const { user } = session.value;

    let { data, error, status } = await supabase
      .from('profiles')
      .select('username, website, avatar_url')
      .eq('id', user.id)
      .single();

    if (error && status !== 406) throw error;

    if (data) {
      username.value = data.username;
      website.value = data.website;
      avatar_url.value = data.avatar_url;
    }
  } catch (error) {
    alert(error.message);
  } finally {
    loading.value = false;
  }
}

async function updateProfile() {
  try {
    loading.value = true;
    const { user } = session.value;

    const updates = {
      id: user.id,
      username: username.value,
      website: website.value,
      avatar_url: avatar_url.value,
      updated_at: new Date(),
    };

    let { error } = await supabase.from('profiles').upsert(updates);

    if (error) throw error;
  } catch (error) {
    alert(error.message);
  } finally {
    loading.value = false;
  }
}

async function signOut() {
  try {
    loading.value = true;
    let { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    alert(error.message);
  } finally {
    loading.value = false;
  }
  router.go(0);
}
</script>

<template>
  <form class="q-pa-md column flex-center flex" @submit.prevent="updateProfile">
    <q-card class="col-6 form-widget">
      <q-card-section>
        <div class="text-h2">Account</div>
        <avatar-uploader
          v-model:path="avatar_url"
          @upload="updateProfile"
          size="10"
        />
        <q-input
          id="email"
          label="Email"
          type="text"
          :model-value="session.user.email"
          disable
        />
        <q-input id="username" label="Name" type="text" v-model="username" />
        <q-input
          id="website"
          label="Website"
          type="website"
          v-model="website"
        />
      </q-card-section>
      <q-card-actions class="q-gutter-md" align="right">
        <q-btn
          type="submit"
          color="primary"
          :label="loading ? 'Loading ...' : 'Update'"
          :disabled="loading"
        />
        <q-btn flat label="Sign Out" @click="signOut" :disabled="loading" />
      </q-card-actions>
    </q-card>
  </form>
</template>

<template>
  <div class="profileList">
    <template v-for="profile in state.propProfiles">
      <profile-card :key="profile.id" :profile="profile" />
    </template>
  </div>
</template>

<script>
import ProfileCard from "./ProfileCard.vue";
export default {
  components: { ProfileCard },
  props: ["profiles"],
  data() {
    return {
      state: {
        propProfiles: this.profiles,
      },
    };
  },
};
</script>
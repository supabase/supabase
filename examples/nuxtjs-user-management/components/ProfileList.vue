<template>
  <div>
    <div v-for="profile in state.propProfiles" :key="profile.id">
      <profile-card :profile="profile" />
    </div>
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
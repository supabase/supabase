<template>
  <div class="profileCard">
    <div class="userInfo">
      <p class="username">{{ state.propProfile.username }}</p>
      <p class="website">{{ state.propProfile.website }}</p>
      <p>
        <small>
          Last updated
          {{
            state.lastUpdated
              ? `${state.lastUpdated.toLocaleDateString()}
          ${state.lastUpdated.toLocaleTimeString()}`
              : "Never"
          }}
        </small>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["profile"],
  data() {
    return {
      state: {
        propProfile: this.profile,
        lastUpdated: this.profile.updated_at
          ? new Date(this.profile.updated_at)
          : null,
      },
    };
  },
};
</script>
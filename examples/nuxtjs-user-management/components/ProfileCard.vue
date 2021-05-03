<template>
  <div className="card">
    <p>Username: {{ state.propProfile.username }}</p>
    <p>Website: {{ state.propProfile.website }}</p>
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
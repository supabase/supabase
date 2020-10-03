<script>
  import TailwindStyles from './TailwindStyles.svelte'

  import Login from './Login'
  import LoggedIn from './LoggedIn'

  let user
</script>

{#if user}
  <LoggedIn bind:user />
{:else}
  <Login bind:user />
{/if}

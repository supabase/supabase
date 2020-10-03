<script>
  import TailwindStyles from './TailwindStyles.svelte'
  import Home from './Home'
  import Login from './Login'
  import LoggedIn from './LoggedIn'


let user
</script>
{#if user}
<LoggedIn bind:user={user} />
{:else}
<Login bind:user={user}/>
{/if}
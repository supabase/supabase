<script>
  import TailwindStyles from './TailwindStyles.svelte'
  import Home from './Home'
  import Login from './Login'
  import LoggedIn from './LoggedIn'


let user
</script>

{!user && (<Login bind:user={user}/>)}
{user && (<LoggedIn bind:user={user})}
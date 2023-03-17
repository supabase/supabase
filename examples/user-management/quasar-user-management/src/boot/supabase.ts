import { boot } from 'quasar/wrappers';
import { createClient } from '@supabase/supabase-js';
import { ref } from 'vue';

// declare module '@vue/runtime-core' {
//   interface ComponentCustomProperties {
//     $supabase: SupabaseClient<Database>;
//   }
// }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type Session = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>['data']['session'];

const session = ref<Session>();
let setPasswordRequested: 'initial' | 'reset' | false = false;

// Hack to process the #access_token and #error before vue-router "cleans up",
// breaking supabase.auth token processing later on
let indexSupabaseHash = window.location.hash.indexOf('#access_token');
if (indexSupabaseHash < 0)
  indexSupabaseHash = window.location.hash.indexOf('#error');
const routerHash = window.location.hash.substring(
  0,
  indexSupabaseHash >= 0 ? indexSupabaseHash : undefined
);

const supabase = createClient(supabaseUrl, supabaseAnonKey);
// must be registered immediately before returning to the event loop because
// otherwise changes triggered by the #access_token, e.g. PASSWORD_RECOVERY,
// would be missed if the **async** supabase.auth._initialize() is processed
// before the callback is registered.
supabase.auth.onAuthStateChange(async (_event, _session) => {
  // console.log('supabase.auth.onAuthStateChange', _event, _session);
  session.value = _session;
  if (_event === 'PASSWORD_RECOVERY') setPasswordRequested = 'reset';

  const userMetaData = session.value?.user.user_metadata;
  if (!userMetaData?.passwordSetup) {
    setPasswordRequested = 'initial';
  }
});

/**
 * Finalize supabase init
 *
 * Shall be called from the router initialization before it is instantiated
 * and mangles the hash parts of the window.location. This function also removes
 * the supabase hash parts and reinstates the vue-router hash parts which are
 * otherwise cleared out by supabase.auth.initialize().
 */
async function init() {
  // this waits for the async init to finish:
  const { error } = await supabase.auth.initialize();
  if (error) window.alert(error.message);
  window.location.hash = routerHash;
}

export default boot(({ router }) => {
  // for use inside Vue files (Options API) through this.$supabase
  // app.config.globalProperties.$supabase = supabase;
  // ^ ^ ^ this will allow you to use this.$supabase (for Vue Options API form)
  //       so you won't necessarily have to import supabase in each vue file
  router.beforeEach((to) => {
    if (setPasswordRequested) {
      to.query.setPassword = setPasswordRequested;
      setPasswordRequested = false;
      return to;
    }
  });
  router.afterEach((to) => {
    if (to.query.setPassword ?? false) {
      // to be implemented if you use password login:
      // execChangePassword(
      //   to.query.setPassword === 'initial'
      //     ? 'Choose password'
      //     : 'Forgot password'
      // ).then(() => {
      //   if (to.query.setPassword === 'initial')
      //     supabase.auth.updateUser({ data: { passwordSetup: true } });
      //   router.replace({ query: { setPassword: undefined } });
      // });
    }
  });
});

export { init, supabase, session };

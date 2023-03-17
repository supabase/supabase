import { boot } from 'quasar/wrappers';
import { session } from './supabase';

export default boot(({ router }) => {
  router.beforeEach((to) => {
    if (to.matched.some((record) => record.meta.requiresAuth ?? false)) {
      // console.log('needs auth: ', to);
      if (!session.value) {
        // console.log('no session!');
        return { name: 'auth', query: { redirect: to.fullPath } };
      }
    }
  });
});

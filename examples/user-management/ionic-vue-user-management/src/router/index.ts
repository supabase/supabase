import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import LoginPage from '../views/Login.vue'
import AccountPage from '../views/Account.vue'
import { supabase } from '../supabase'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/account',
    name: 'Account',
    component: AccountPage,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (to.path === '/account' && !claims) {
    next('/')
    return
  }

  if (to.path === '/' && claims) {
    next('/account')
    return
  }

  next()
})

export default router

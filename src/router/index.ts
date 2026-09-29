import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      name: 'home',
      component: () => import('@/App.vue').catch(() => {}), // dummy component, we don't use router-view
    }
  ],
})

export default router

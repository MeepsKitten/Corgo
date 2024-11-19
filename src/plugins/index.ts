/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import { createRouter, createWebHistory } from 'vue-router/auto'
import BingoBoard from '@/components/bingoBoard.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Types
import type { App } from 'vue'


export function registerPlugins (app: App) {
  const router = createRouter({
    history: createWebHistory('/Corgo/'),
    routes: []
  })
  
  // Add all routes explicitly
  router.addRoute({
    path: '/',
    redirect: '/daily'
  })

  router.addRoute({
    path: '/daily',
    component: BingoBoard,
    props: { mode: 'daily' }
  })

  router.addRoute({
    path: '/versus',
    component: BingoBoard,
    props: { mode: 'versus' }
  })

  router.addRoute({
    path: '/random',
    component: BingoBoard,
    props: { mode: 'random' }
  })

  // Debug: Log all registered routes
  //console.log('Available routes:', router.getRoutes())
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
}
